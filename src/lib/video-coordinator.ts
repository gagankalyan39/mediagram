'use client';

/**
 * Central Video Coordinator
 * 
 * Rules enforced:
 * 1. STRICTLY ONE video can play at any time across the entire application and feed.
 * 2. ONLY the particular video the user plays is allowed to play.
 * 3. All other videos are paused immediately when any video starts playing.
 * 4. Other videos NEVER play automatically in the background or while another video is playing.
 * 5. As the user scrolls, if the playing video goes off-screen, it pauses to save resources.
 * 6. Browser autoplay policy handling: If browser blocks unmuted audio before user interaction,
 *    temporarily plays muted and unmuted on user gesture.
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

        // Immediately pause every other video element in the entire DOM
        document.querySelectorAll('video').forEach((v) => {
          if (v !== targetVideo && !v.paused) {
            v.pause();
          }
        });
      },
      true
    );

    // Viewport scroll & resize tracking (throttled via requestAnimationFrame)
    const onViewportChange = () => {
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.handleViewportChange();
        this.rafId = null;
      });
    };

    window.addEventListener('scroll', onViewportChange, { passive: true });
    window.addEventListener('resize', onViewportChange, { passive: true });

    // Document visibility: pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseActive();
      }
    });

    // Periodic safety check: if the active playing video scrolled completely off screen, pause it
    this.checkInterval = setInterval(() => {
      if (!this.isModalOpen && !document.hidden && this.entries.size > 0) {
        this.handleViewportChange();
      }
    }, 1000);
  }

  public register(entry: VideoEntry): () => void {
    this.entries.set(entry.id, entry);

    return () => {
      if (this.activeId === entry.id) {
        entry.onDeactivate();
        this.activeId = null;
      }
      this.entries.delete(entry.id);
    };
  }

  public handleViewportChange() {
    if (this.isModalOpen || typeof window === 'undefined' || this.entries.size === 0) {
      return;
    }

    const windowHeight = window.innerHeight;

    // If there is currently an active video that is playing:
    if (this.activeId) {
      const activeEntry = this.entries.get(this.activeId);
      if (activeEntry && activeEntry.video && !activeEntry.video.paused) {
        if (activeEntry.element) {
          const rect = activeEntry.element.getBoundingClientRect();
          // If scrolled completely off-screen, pause it so it doesn't run in the background
          if (rect.bottom <= 60 || rect.top >= windowHeight - 60) {
            activeEntry.onDeactivate();
            this.activeId = null;
            this.notify();
          } else {
            // The active video is playing and visible: ensure strictly NO other video is playing
            this.entries.forEach((entry, id) => {
              if (id !== this.activeId && entry.video && !entry.video.paused) {
                entry.onDeactivate();
              }
            });
            return;
          }
        }
      }
    }
  }

  public updateActiveVideo() {
    this.handleViewportChange();
  }

  /**
   * Explicitly play a specific video.
   * Guarantees that ALL other videos are immediately paused and only this video plays.
   */
  public playVideo(id: string) {
    this.userHasInteracted = true;
    this.activeId = id;

    // 1. Immediately deactivate and pause every other registered entry
    this.entries.forEach((entry, entryId) => {
      if (entryId !== id) {
        entry.onDeactivate();
      }
    });

    // 2. Pause every other video in the entire DOM
    if (typeof document !== 'undefined') {
      const activeEntry = this.entries.get(id);
      const activeVid = activeEntry?.video;
      document.querySelectorAll('video').forEach((v) => {
        if (v !== activeVid && !v.paused) {
          v.pause();
        }
      });
    }

    const current = this.entries.get(id);
    if (current) {
      current.resetManualPause();
    }

    this.notify();
  }

  /**
   * Called when any registered video starts playing (e.g. from native onPlay event).
   * Ensures that all other videos are immediately paused.
   */
  public onVideoStartedPlaying(id: string, videoElement: HTMLVideoElement | null) {
    this.userHasInteracted = true;
    this.activeId = id;

    // 1. Deactivate all other registered entries
    this.entries.forEach((entry, entryId) => {
      if (entryId !== id) {
        entry.onDeactivate();
      }
    });

    // 2. Pause any other video in the DOM
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((v) => {
        if (v !== videoElement && !v.paused) {
          v.pause();
        }
      });
    }

    this.notify();
  }

  public onVideoManuallyPaused(id: string) {
    if (this.activeId === id) {
      // Keep activeId marked as paused
    }
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
        if (!v.paused) v.pause();
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
        if (!v.paused) v.pause();
      });
    }
    this.notify();
  }

  public setModalOpen(open: boolean) {
    this.isModalOpen = open;
    if (open) {
      this.pauseActive();
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
