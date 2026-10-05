'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Reel, User } from '@/lib/types';
import { GlassAvatar } from '../glass/GlassAvatar';
import { GlassModal } from '../glass/GlassModal';
import { store } from '@/lib/store';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  ChevronDown,
  ChevronUp,
  Play,
  Cloud,
  Send,
  Shuffle
} from 'lucide-react';
import Link from 'next/link';

import { videoCoordinator } from '@/lib/video-coordinator';

interface ReelsFeedProps {
  reels: Reel[];
  currentUser: User;
  onToggleLike: (reelId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onShuffle?: () => void;
  onLoadMore?: () => void;
  onReelViewed?: (reelId: string) => void;
}

export function ReelsFeed({
  reels,
  currentUser,
  onToggleLike,
  onToggleBookmark,
  onShuffle,
  onLoadMore,
  onReelViewed,
}: ReelsFeedProps) {
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(() => !videoCoordinator.isSoundOn()); // Unmuted by default!
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeCommentReel, setActiveCommentReel] = useState<Reel | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [showShuffleToast, setShowShuffleToast] = useState(false);
  const [, setStoreTick] = useState(0);

  // When Reels mounts, silence any other feed video
  useEffect(() => {
    videoCoordinator.pauseAll();
  }, []);

  useEffect(() => {
    const handleUpdate = () => setStoreTick((t) => t + 1);
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, []);
  
  // DSA: Fast O(1) video element lookup map to ensure correct video control across reorders
  const videoMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Automatic snap scroll intersection observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll('.reel-item');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idxStr = entry.target.getAttribute('data-reel-index');
            if (idxStr !== null) {
              const idx = parseInt(idxStr, 10);
              setActiveReelIndex(idx);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [reels]);

  // Infinite Stream: Trigger onLoadMore and register watched reel
  useEffect(() => {
    if (activeReelIndex >= reels.length - 3 && onLoadMore) {
      onLoadMore();
    }
    const currentReel = reels[activeReelIndex];
    if (currentReel && onReelViewed) {
      onReelViewed(currentReel.id);
    }
  }, [activeReelIndex, reels.length, onLoadMore, onReelViewed]);

  // Unlock unmuted sound on ANY user gesture (mobile touch, click, scroll, keydown)
  useEffect(() => {
    const handleUnlockGesture = () => {
      if (!isMuted) {
        const activeReel = reels[activeReelIndex];
        if (activeReel) {
          const curVid = videoMapRef.current.get(activeReel.id);
          if (curVid) {
            curVid.muted = false;
            curVid.volume = 1.0;
          }
        }
      }
    };

    const gestureEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown', 'scroll'];
    gestureEvents.forEach((ev) => window.addEventListener(ev, handleUnlockGesture, { passive: true, capture: true }));

    return () => {
      gestureEvents.forEach((ev) => window.removeEventListener(ev, handleUnlockGesture));
    };
  }, [activeReelIndex, reels, isMuted]);

  // Keyboard navigation for reels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToReel(Math.min(reels.length - 1, activeReelIndex + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToReel(Math.max(0, activeReelIndex - 1));
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => {
          const next = !prev;
          videoCoordinator.setSoundEnabled(!next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeReelIndex, reels.length]);

  const goToReel = (index: number) => {
    setActiveReelIndex(index);
    const reel = reels[index];
    if (reel) {
      const vid = videoMapRef.current.get(reel.id);
      vid?.parentElement?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Play/pause and sound management: STRICTLY the active reel plays unmuted
  useEffect(() => {
    const activeReel = reels[activeReelIndex];
    if (!activeReel) return;

    videoMapRef.current.forEach((vid, id) => {
      if (vid) {
        if (id === activeReel.id) {
          vid.muted = isMuted;
          vid.volume = isMuted ? 0 : 1.0;
          const playPromise = vid.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              // Browser policy fallback: play muted until first touch
              vid.muted = true;
              vid.play().catch(() => {});
            });
          }
        } else {
          vid.pause();
          vid.currentTime = 0;
          vid.muted = true;
        }
      }
    });

    return () => {
      // Pause all on unmount
      videoMapRef.current.forEach((vid) => {
        if (vid) {
          vid.pause();
          vid.muted = true;
        }
      });
    };
  }, [activeReelIndex, isMuted, reels]);

  const handleShuffleClick = () => {
    setShowShuffleToast(true);
    setTimeout(() => setShowShuffleToast(false), 2200);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setActiveReelIndex(0);
    if (onShuffle) {
      onShuffle();
    }
  };

  const handleVideoTap = (reel: Reel) => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    if (diff > 0 && diff < 320) {
      // Double tap detected! Like reel without play/pause toggle
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      lastTapRef.current = 0;
      if (!reel.isLiked) {
        onToggleLike(reel.id);
      }
      return;
    }
    lastTapRef.current = now;

    clickTimerRef.current = setTimeout(() => {
      const vid = videoMapRef.current.get(reel.id);
      if (vid) {
        if (vid.paused) {
          vid.play().catch(() => {});
          setIsPlaying(true);
        } else {
          vid.pause();
          setIsPlaying(false);
        }
      }
      clickTimerRef.current = null;
    }, 260);
  };

  const handleVideoTouchEnd = (e: React.TouchEvent, reel: Reel) => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    if (diff > 0 && diff < 320) {
      e.preventDefault();
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
      lastTapRef.current = 0;
      if (!reel.isLiked) {
        onToggleLike(reel.id);
      }
      return;
    }
    lastTapRef.current = now;
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeCommentReel) return;

    store.addComment(activeCommentReel.postId, commentInput.trim());
    setCommentInput('');
    activeCommentReel.commentsCount += 1;
  };

  return (
    <div className="flex items-center justify-center gap-4 w-full min-h-[calc(100vh-80px)] relative">
      {/* Dynamic Shuffle Feedback Toast */}
      {showShuffleToast && (
        <div className="absolute top-2 z-50 px-4 py-2 rounded-full bg-emerald-400 text-black font-extrabold text-xs shadow-2xl backdrop-blur-md flex items-center gap-2 animate-pulse border border-emerald-200">
          <Shuffle className="w-3.5 h-3.5" />
          <span>Shuffled! Discovering fresh reels...</span>
        </div>
      )}

      {/* Main Reels Vertical Snap Container */}
      <div
        ref={containerRef}
        className="w-full max-w-[420px] reels-container rounded-3xl"
      >
        {reels.map((reel, index) => {
          const isNearActive = Math.abs(index - activeReelIndex) <= 1;

          return (
            <div
              key={reel.id}
              data-reel-index={index}
              className="reel-item relative w-full h-[calc(100vh-80px)] max-h-[820px] rounded-3xl overflow-hidden glass border border-white/15 my-2 shadow-2xl flex items-center justify-center bg-black"
            >
              {/* Main Video Element with O(1) Map Registration */}
              <video
                ref={(el) => {
                  if (el) {
                    videoMapRef.current.set(reel.id, el);
                  } else {
                    videoMapRef.current.delete(reel.id);
                  }
                }}
                src={reel.videoUrl}
                poster={reel.posterUrl && !reel.posterUrl.includes('.mp4') ? reel.posterUrl : undefined}
                preload={isNearActive ? "metadata" : "none"}
                loop
                playsInline
                muted={isMuted}
                onClick={() => handleVideoTap(reel)}
                onTouchEnd={(e) => handleVideoTouchEnd(e, reel)}
                className="w-full h-full object-cover cursor-pointer select-none"
              />

              {/* Top Controls: Sound, Randomize & Cloudinary Pill */}
              <div className="absolute top-4 inset-x-4 flex items-center justify-between z-20 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-[10px] text-cyan-300 font-semibold shadow-lg">
                    <Cloud className="w-3 h-3 text-cyan-400" />
                    <span>Adaptive Video</span>
                  </div>

                  {onShuffle && (
                    <button
                      onClick={handleShuffleClick}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-md border border-emerald-400/50 text-[11px] text-emerald-300 font-bold shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
                      title="Shuffle Reels (DSA Fisher-Yates Random Discovery)"
                    >
                      <Shuffle className="w-3 h-3 text-emerald-400" />
                      <span>Randomize</span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-2.5 py-1 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                    !isMuted
                      ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-200 shadow-amber-400/30'
                      : 'bg-black/60 hover:bg-black/80 text-white border-white/20'
                  }`}
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                      <span className="text-[10px] font-bold text-rose-200">Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-black animate-pulse" />
                      <span className="text-[10px] font-extrabold text-black">Sound ON</span>
                    </>
                  )}
                </button>
              </div>

              {/* Right Action Sidebar */}
              <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5">
                {/* Author Avatar with Story Ring */}
                <div className="relative group">
                  <Link href={`/profile/${reel.user.username}`}>
                    <GlassAvatar
                      src={reel.user.avatarUrl}
                      name={reel.user.name}
                      size="sm"
                      isVerified={reel.user.isVerified}
                    />
                  </Link>
                </div>

                {/* Like Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleLike(reel.id); }}
                  className="flex flex-col items-center gap-1 group cursor-pointer touch-manipulation select-none active:scale-110"
                >
                  <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:scale-110 group-hover:bg-black/70 transition-all">
                    <Heart
                      className={`w-6 h-6 transition-colors ${
                        reel.isLiked
                          ? 'text-rose-500 fill-rose-500'
                          : 'text-white group-hover:text-rose-400'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-white shadow-sm">
                    {reel.likesCount.toLocaleString()}
                  </span>
                </button>

                {/* Comments Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveCommentReel(reel); }}
                  className="flex flex-col items-center gap-1 group cursor-pointer touch-manipulation select-none active:scale-110"
                >
                  <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:scale-110 group-hover:bg-black/70 transition-all">
                    <MessageCircle className="w-6 h-6 text-white group-hover:text-amber-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white shadow-sm">
                    {reel.commentsCount.toLocaleString()}
                  </span>
                </button>

                {/* Share Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({ title: reel.caption, url: window.location.href });
                    }
                  }}
                  className="flex flex-col items-center gap-1 group cursor-pointer touch-manipulation select-none active:scale-110"
                >
                  <div className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 group-hover:scale-110 transition-all">
                    <Share2 className="w-6 h-6 text-white group-hover:text-cyan-400" />
                  </div>
                  <span className="text-[11px] font-bold text-white shadow-sm">
                    {reel.sharesCount}
                  </span>
                </button>

                {/* Bookmark Button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleBookmark(reel.postId); }}
                  className="p-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:scale-110 active:scale-110 transition-all cursor-pointer touch-manipulation select-none"
                >
                  <Bookmark
                    className={`w-6 h-6 ${
                      reel.isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-white'
                    }`}
                  />
                </button>

                {/* Rotating Music Disc */}
                <div className="w-8 h-8 rounded-full border-2 border-white/30 bg-black flex items-center justify-center animate-spin [animation-duration:6s] shadow-lg">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500" />
                </div>
              </div>

              {/* Bottom Reel Caption & Audio Overlay */}
              <div className="absolute bottom-4 inset-x-4 z-20 space-y-2 pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <Link
                    href={`/profile/${reel.user.username}`}
                    className="text-sm font-bold text-white hover:underline flex items-center gap-1 drop-shadow-md"
                  >
                    @{reel.user.username}
                  </Link>
                  {reel.user.isVerified && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  )}
                  {reel.userId !== currentUser.id && (
                    <button
                      onClick={() => {
                        store.toggleFollow(reel.userId);
                      }}
                      className={`px-3 py-1 rounded-full backdrop-blur-md text-[11px] font-bold border ml-2 transition-all cursor-pointer ${
                        store.isFollowing(reel.userId)
                          ? 'bg-white/20 hover:bg-white/30 text-white/80 border-white/20'
                          : 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-md'
                      }`}
                    >
                      {store.isFollowing(reel.userId) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-white/90 drop-shadow line-clamp-2 leading-relaxed">
                  {reel.caption}
                </p>

                {/* Music Marquee Ticker */}
                <div className="flex items-center gap-2 text-[11px] text-white/80 pointer-events-auto">
                  <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate max-w-[240px] drop-shadow font-medium">
                    {reel.audioTrackTitle}
                  </span>
                </div>
              </div>

              {/* Ambient bottom shadow gradient for contrast */}
              <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
            </div>
          );
        })}
      </div>

      {/* Desktop Vertical Next / Prev Navigation Buttons */}
      <div className="hidden lg:flex flex-col gap-3">
        <button
          onClick={() => goToReel(Math.max(0, activeReelIndex - 1))}
          disabled={activeReelIndex === 0}
          className="p-3 rounded-full glass border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer shadow-lg"
          title="Previous Reel (Arrow Up)"
        >
          <ChevronUp className="w-5 h-5" />
        </button>


        <button
          onClick={() => goToReel(Math.min(reels.length - 1, activeReelIndex + 1))}
          disabled={activeReelIndex === reels.length - 1}
          className="p-3 rounded-full glass border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition-all cursor-pointer shadow-lg"
          title="Next Reel (Arrow Down)"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      </div>

      {/* Reel Comments Drawer / Modal */}
      {activeCommentReel && (
        <GlassModal
          isOpen={!!activeCommentReel}
          onClose={() => setActiveCommentReel(null)}
          title={`Comments (${activeCommentReel.commentsCount})`}
          maxWidth="sm"
        >
          <div className="flex flex-col h-[400px]">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {/* Creator Caption */}
              <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-2.5">
                <GlassAvatar
                  src={activeCommentReel.user.avatarUrl}
                  name={activeCommentReel.user.name}
                  size="xs"
                />
                <div className="text-xs">
                  <span className="font-bold text-white mr-1.5">
                    {activeCommentReel.user.username}
                  </span>
                  <span className="text-white/80">{activeCommentReel.caption}</span>
                </div>
              </div>

              {/* Sample Comments */}
              <div className="space-y-2 pt-2">
                {[
                  { user: 'customer', text: 'Incredible frame rates on this video! What rig did you use?' },
                  { user: 'admin', text: 'Verified video asset. Cloudinary adaptive streaming delivering at 60fps.' },
                ].map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-[10px] text-white">
                      {c.user[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-white mr-1.5">@{c.user}</span>
                      <span className="text-white/80">{c.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-white/10 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="p-2 rounded-full bg-amber-400 text-black hover:bg-amber-300 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
