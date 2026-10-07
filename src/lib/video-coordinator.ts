'use client';

/**
 * Central Video Coordinator
 * 
 * Rules enforced:
 * 1. STRICTLY ONE video can play at any time across the entire application and feed.
 * 2. As the user scrolls, ONLY the video currently on screen (closest to viewport center) plays.
 * 3. All other videos are paused and muted immediately — zero audio/video overlap.
 * 4. Persistent sound preference across posts and reels.
 */

export interface VideoEntry {
  id: string;
  element: HTMLElement;
  video: HTMLVideoElement;
  onActivate: (unmuted: boolean) => void;
  onDeactivate: () => void;
  isManuallyPaused: () => boolean;
  resetManualPause: () => void;
}

class VideoCoordinator {
  private entries = new Map<string, VideoEntry>();
  private activeId: string | null = null;
  private soundEnabled: boolean = true; // User preference: UNMUTED by default
  private userHasInteracted: boolean = false;
  private isModalOpen: boolean = false;
  private listeners = new Set<() => void>();
  private rafId: number | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initGlobalListeners();
    }
  }

  private initGlobalListeners() {
    // Unlock browser audio restrictions on first user interaction
    const unlockGesture = () => {
      if (!this.userHasInteracted) {
        this.userHasInteracted = true;
        if (this.activeId && this.soundEnabled) {
          const entry = this.entries.get(this.activeId);
          if (entry?.video) {
            entry.video.muted = false;
            entry.video.volume = 1.0;
          }
        }
        this.notify();
      }
    };

    const gestures = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown', 'wheel'];
    gestures.forEach((evt) => {
      window.addEventListener(evt, unlockGesture, { passive: true, capture: true });
    });

    // Global capture listener: strictly enforce that only ONE video element can play at a time in the entire document
    document.addEventListener(
      'play',
      (event) => {
        const targetVideo = event.target as HTMLVideoElement;
        if (!targetVideo || targetVideo.tagName !== 'VIDEO') return;

        // Immediately pause and mute every other video element in the entire DOM
        document.querySelectorAll('video').forEach((v) => {
          if (v !== targetVideo && !v.paused) {
            v.pause();
            v.muted = true;
          }
        });
      },
      true
    );

    // Viewport scroll & resize tracking (throttled via requestAnimationFrame)
    const onViewportChange = () => {
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.updateActiveVideo();
        this.rafId = null;
      });
    };

    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange, { passive: true });

    // Document visibility: pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseActive();
      } else {
        this.updateActiveVideo();
      }
    });

    // Periodic check (every 500ms) to ensure state never desyncs during fast scroll
    this.checkInterval = setInterval(() => {
      if (!this.isModalOpen && !document.hidden && this.entries.size > 0) {
        this.updateActiveVideo();
      }
    }, 500);
  }

  public register(entry: VideoEntry): () => void {
    this.entries.set(entry.id, entry);
    // Queue evaluation for active video on scroll-in/mount
    requestAnimationFrame(() => this.updateActiveVideo());

    return () => {
      if (this.activeId === entry.id) {
        entry.onDeactivate();
        this.activeId = null;
      }
      this.entries.delete(entry.id);
    };
  }

  public updateActiveVideo() {
    if (this.isModalOpen || typeof window === 'undefined' || this.entries.size === 0) {
      return;
    }

    if (document.hidden) {
      this.pauseActive();
      return;
    }

    const windowHeight = window.innerHeight;
    const viewportCenter = windowHeight / 2;

    let bestId: string | null = null;
    let bestScore = -Infinity;

    for (const [id, entry] of this.entries.entries()) {
      if (!entry.element || !entry.video) continue;

      const rect = entry.element.getBoundingClientRect();

      // Completely outside viewport?
      if (rect.bottom <= 40 || rect.top >= windowHeight - 40) {
        entry.resetManualPause();
        if (!entry.video.paused) {
          entry.onDeactivate();
        }
        continue;
      }

      // Calculate vertical visibility
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / Math.max(1, rect.height);

      // Must be at least 25% visible to qualify as active
      if (visibilityRatio < 0.25) {
        if (!entry.video.paused && id !== this.activeId) {
          entry.onDeactivate();
        }
        continue;
      }

      // Distance from element center to screen center
      const elementCenter = rect.top + rect.height / 2;
      const distFromCenter = Math.abs(elementCenter - viewportCenter);
      const normDist = distFromCenter / (windowHeight / 2);

      // Respect user's explicit pause if user manually paused this video while on screen
      if (entry.isManuallyPaused()) {
        continue;
      }

      // Score: high visibility ratio + proximity to center of screen
      const score = visibilityRatio * 2.5 - normDist;

      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    if (bestId !== this.activeId) {
      // 1. Deactivate previously active video
      if (this.activeId) {
        const prev = this.entries.get(this.activeId);
        if (prev) {
          prev.onDeactivate();
        }
      }

      this.activeId = bestId;

      // 2. Activate the new primary video on screen!
      if (bestId) {
        const next = this.entries.get(bestId);
        if (next) {
          next.onActivate(this.soundEnabled);
        }
      }

      // 3. Strictly pause & mute all other video elements in the DOM
      if (typeof document !== 'undefined') {
        const activeEntry = bestId ? this.entries.get(bestId) : null;
        const activeVid = activeEntry?.video;
        document.querySelectorAll('video').forEach((v) => {
          if (v !== activeVid) {
            v.pause();
            v.muted = true;
          }
        });
      }

      this.notify();
    } else if (bestId && this.activeId === bestId) {
      // Ensure the active video is actually playing if not manually paused
      const cur = this.entries.get(bestId);
      if (cur && !cur.isManuallyPaused() && cur.video.paused) {
        cur.onActivate(this.soundEnabled);
      }
    }
  }

  public playVideo(id: string) {
    this.userHasInteracted = true;
    
    // Deactivate all other registered entries
    this.entries.forEach((entry, entryId) => {
      if (entryId !== id) {
        entry.onDeactivate();
      }
    });

    this.activeId = id;

    // Pause all other video elements in DOM
    if (typeof document !== 'undefined') {
      const activeEntry = this.entries.get(id);
      const activeVid = activeEntry?.video;
      document.querySelectorAll('video').forEach((v) => {
        if (v !== activeVid && !v.paused) {
          v.pause();
          v.muted = true;
        }
      });
    }

    const current = this.entries.get(id);
    if (current) {
      current.resetManualPause();
      current.onActivate(this.soundEnabled);
    }

    this.notify();
  }

  public onVideoStartedPlaying(id: string, videoElement: HTMLVideoElement | null) {
    this.userHasInteracted = true;
    this.activeId = id;

    this.entries.forEach((entry, entryId) => {
      if (entryId !== id) {
        entry.onDeactivate();
      }
    });

    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== videoElement && !v.paused) {
          v.pause();
          v.muted = true;
        }
      });
    }

    this.notify();
  }

  public onVideoManuallyPaused(id: string) {
    // Keep activeId marked
  }

  public setActiveManually(id: string) {
    this.playVideo(id);
  }

  public pauseActive() {
    if (this.activeId) {
      const cur = this.entries.get(this.activeId);
      if (cur) cur.onDeactivate();
      this.activeId = null;
    }
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        if (!v.paused) {
          v.pause();
          v.muted = true;
        }
      });
    }
    this.notify();
  }

  public pauseAll() {
    this.entries.forEach((entry) => {
      entry.onDeactivate();
    });
    this.activeId = null;
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        if (!v.paused) {
          v.pause();
          v.muted = true;
        }
      });
    }
    this.notify();
  }

  public setModalOpen(open: boolean) {
    this.isModalOpen = open;
    if (open) {
      this.pauseActive();
    } else {
      setTimeout(() => this.updateActiveVideo(), 100);
    }
  }

  public isSoundOn(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (this.activeId) {
      const cur = this.entries.get(this.activeId);
      if (cur?.video) {
        cur.video.muted = !enabled;
        cur.video.volume = enabled ? 1.0 : 0;
      }
    }
    this.notify();
  }

  public toggleSound(): boolean {
    const next = !this.soundEnabled;
    this.setSoundEnabled(next);
    return next;
  }

  public getActiveId(): string | null {
    return this.activeId;
  }

  public hasInteracted(): boolean {
    return this.userHasInteracted;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }
}

// Global Singleton
export const videoCoordinator = new VideoCoordinator();
