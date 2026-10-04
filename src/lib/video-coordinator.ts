'use client';

/**
 * Central Video Coordinator
 * 
 * Rules enforced:
 * 1. STRICTLY ONE video can play at any time across the entire feed.
 * 2. ONLY the video the user is currently watching (closest to viewport center and >= 35% visible) plays.
 * 3. When watching that video, it plays UNMUTED with audio by default.
 * 4. All other videos are paused and muted immediately.
 * 5. As the user scrolls, off-screen videos pause, and the new visible video plays unmuted.
 * 6. Browser autoplay policy handling: If browser blocks unmuted audio before user interaction,
 *    temporarily plays muted and UNMUTES IMMEDIATELY on the very first touch / click / scroll gesture anywhere.
 * 7. Persistent sound preference across posts and reels.
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
        // If an active video is playing muted due to browser policy, unmute it now!
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

    // Document visibility: pause when tab hidden, resume when tab visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseActive();
      } else {
        this.updateActiveVideo();
      }
    });

    // Periodic safety check (every 600ms) to ensure video state never desyncs during fast swipe/scroll
    this.checkInterval = setInterval(() => {
      if (!this.isModalOpen && !document.hidden && this.entries.size > 0) {
        this.updateActiveVideo();
      }
    }, 600);
  }

  public register(entry: VideoEntry): () => void {
    this.entries.set(entry.id, entry);
    // Queue active video evaluation
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

    const windowHeight = window.innerHeight;
    const viewportCenter = windowHeight / 2;

    let bestId: string | null = null;
    let bestScore = -Infinity;

    for (const [id, entry] of this.entries.entries()) {
      if (!entry.element || !entry.video) continue;

      const rect = entry.element.getBoundingClientRect();

      // Completely outside viewport?
      if (rect.bottom <= 40 || rect.top >= windowHeight - 40) {
        // Reset manual pause state if it scrolled well off screen
        entry.resetManualPause();
        continue;
      }

      // Calculate vertical visibility
      const visibleTop = Math.max(0, rect.top);
      const visibleBottom = Math.min(windowHeight, rect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibilityRatio = visibleHeight / Math.max(1, rect.height);

      // Must be at least 30% visible to qualify as "watched"
      if (visibilityRatio < 0.3) continue;

      // Distance from element center to screen center
      const elementCenter = rect.top + rect.height / 2;
      const distFromCenter = Math.abs(elementCenter - viewportCenter);
      const normDist = distFromCenter / (windowHeight / 2);

      // Score: high visibility + proximity to screen center
      const score = visibilityRatio * 2.5 - normDist;

      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    if (bestId !== this.activeId) {
      // Deactivate previously active video
      if (this.activeId) {
        const prev = this.entries.get(this.activeId);
        if (prev) {
          prev.onDeactivate();
        }
      }

      this.activeId = bestId;

      // Activate new primary video
      if (bestId) {
        const next = this.entries.get(bestId);
        if (next && !next.isManuallyPaused()) {
          next.onActivate(this.soundEnabled);
        }
      }

      this.notify();
    } else if (bestId && this.activeId === bestId) {
      // Ensure the active video is actually playing if not paused
      const cur = this.entries.get(bestId);
      if (cur && !cur.isManuallyPaused() && cur.video.paused) {
        cur.onActivate(this.soundEnabled);
      }
    }
  }

  public setActiveManually(id: string) {
    if (this.activeId && this.activeId !== id) {
      const prev = this.entries.get(this.activeId);
      if (prev) prev.onDeactivate();
    }
    this.activeId = id;
    const cur = this.entries.get(id);
    if (cur) {
      cur.onActivate(this.soundEnabled);
    }
    this.notify();
  }

  public pauseActive() {
    if (this.activeId) {
      const cur = this.entries.get(this.activeId);
      if (cur) cur.onDeactivate();
    }
  }

  public pauseAll() {
    this.entries.forEach((entry) => {
      entry.onDeactivate();
    });
    this.activeId = null;
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
