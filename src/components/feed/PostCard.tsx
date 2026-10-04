'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Post, User } from '@/lib/types';
import { GlassAvatar } from '../glass/GlassAvatar';
import { CloudinaryBadge } from './CloudinaryBadge';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Film
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getVideoPosterUrl } from '@/lib/cloudinary';
import { store } from '@/lib/store';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
}

export function PostCard({
  post,
  currentUser,
  onToggleLike,
  onToggleBookmark,
  onAddComment,
}: PostCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  // Home feed video auto-play & unmuted playback with single-active video coordination
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Unmuted by default per user request
  const [isInView, setIsInView] = useState(false);

  // Dynamic Follow state synced with platform store
  const [isFollowing, setIsFollowing] = useState<boolean>(() =>
    typeof store.isFollowing === 'function' ? store.isFollowing(post.user.id) : false
  );

  useEffect(() => {
    const handleStoreUpdate = () => {
      if (typeof store.isFollowing === 'function') {
        setIsFollowing(store.isFollowing(post.user.id));
      }
    };
    window.addEventListener('beesocial:store_updated', handleStoreUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleStoreUpdate);
  }, [post.user.id]);

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof store.toggleFollow === 'function') {
      const res = store.toggleFollow(post.user.id);
      setIsFollowing(res);
    }
  };

  // Coordinated double-tap detection: ensures double tap LIKES and NEVER toggles play/pause
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapTimeRef = useRef<number>(0);

  const mediaList = post.media || [];
  const activeMedia = mediaList[currentMediaIndex];

  const startPlaying = () => {
    const video = videoRef.current;
    if (!video) return;

    if (typeof window !== 'undefined') {
      (window as any).__beesocialFeedVideoActive = true;
      window.dispatchEvent(
        new CustomEvent('beesocial:active_video', { detail: { postId: post.id } })
      );
    }

    video.muted = isMuted;
    video.volume = isMuted ? 0 : 1.0;
    video.loop = true;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => {
          // If browser restricts unmuted autoplay before any gesture, play muted temporarily
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    }
  };

  const pauseVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsPlaying(false);
  };

  // Listen for other videos playing so ONLY the focused video plays and others pause
  useEffect(() => {
    const onActiveVideo = (e: Event) => {
      const customEvent = e as CustomEvent<{ postId: string }>;
      if (customEvent.detail?.postId !== post.id) {
        const video = videoRef.current;
        if (video && !video.paused) {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    window.addEventListener('beesocial:active_video', onActiveVideo);
    return () => {
      window.removeEventListener('beesocial:active_video', onActiveVideo);
    };
  }, [post.id]);

  // On page reload, do NOT auto-play. Only start when user presses play or scrolls into primary focus after play is initiated.
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!container || activeMedia?.resourceType !== 'video') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isPrimaryVisible = entry.isIntersecting && entry.intersectionRatio >= 0.65;
          setIsInView(entry.isIntersecting);

          if (isPrimaryVisible) {
            // When user is actively watching feed videos, automatically switch playback to the centered video
            if (typeof window !== 'undefined' && (window as any).__beesocialFeedVideoActive) {
              if (video && video.paused) {
                startPlaying();
              }
            }
          } else {
            // When scrolled away from view, PAUSE THIS VIDEO so only the video currently in view plays!
            if (video && !video.paused) {
              pauseVideo();
            }
          }
        });
      },
      {
        threshold: [0.1, 0.65],
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [activeMedia, post.id, isMuted]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      startPlaying();
    } else {
      pauseVideo();
      if (typeof window !== 'undefined') {
        (window as any).__beesocialFeedVideoActive = false;
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const video = videoRef.current;
    if (video) {
      video.muted = nextMuted;
      video.volume = nextMuted ? 0 : 1.0;
    }
  };

  const handleDoubleTap = () => {
    if (!post.isLiked) {
      onToggleLike(post.id);
    }
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
  };

  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;

    if (timeDiff > 0 && timeDiff < 320) {
      // Double click / tap detected!
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleDoubleTap();
      return;
    }

    lastTapTimeRef.current = now;

    // Single click: if video, schedule play/pause toggle after grace period
    if (activeMedia?.resourceType === 'video') {
      clickTimeoutRef.current = setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          startPlaying();
        } else {
          pauseVideo();
          if (typeof window !== 'undefined') {
            (window as any).__beesocialFeedVideoActive = false;
          }
        }
        clickTimeoutRef.current = null;
      }, 260);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;
    if (timeDiff > 0 && timeDiff < 320) {
      e.preventDefault();
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleDoubleTap();
      return;
    }
    lastTapTimeRef.current = now;
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
    setShowAllComments(true);
  };

  return (
    <article className="glass-card overflow-hidden border border-white/10 mb-6">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.user.username}`}>
            <GlassAvatar
              src={post.user.avatarUrl}
              name={post.user.name}
              size="sm"
              isVerified={post.user.isVerified}
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/profile/${post.user.username}`}
                className="text-xs font-bold text-white hover:underline"
              >
                {post.user.username}
              </Link>
              {post.user.isVerified && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
              {post.user.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all cursor-pointer border ml-1 ${
                    isFollowing
                      ? 'bg-white/10 hover:bg-white/20 text-white/70 border-white/10'
                      : 'bg-amber-400 hover:bg-amber-300 text-black border-amber-300 shadow-sm shadow-amber-400/20'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            {post.location && (
              <p className="text-[11px] text-white/50">{post.location}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeMedia && <CloudinaryBadge media={activeMedia} />}
          <button className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Explainable ML Recommendation Bar */}
      {post.recommendationExplanation && (
        <div className="px-3.5 py-1.5 bg-gradient-to-r from-purple-950/50 via-indigo-950/30 to-black/40 border-b border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-purple-200">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span suppressHydrationWarning className="font-bold text-amber-300 font-mono">
              {post.recommendationExplanation.overallScore}% ML Match
            </span>
            <span className="text-white/30">•</span>
            <span className="text-white/70 line-clamp-1 text-[10px]">
              {post.recommendationExplanation.reasons[0] || 'Algorithmic affinity match'}
            </span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono shrink-0 ml-2">
            Cloudinary AI Vision
          </span>
        </div>
      )}

      {/* Media Carousel / Single Asset */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] sm:aspect-square bg-black/60 overflow-hidden select-none cursor-pointer flex items-center justify-center group"
        onClick={handleMediaClick}
        onTouchEnd={handleTouchEnd}
      >
        {activeMedia ? (
          activeMedia.resourceType === 'video' ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                src={activeMedia.optimizedUrl || activeMedia.originalUrl}
                poster={
                  activeMedia.thumbnailUrl && !activeMedia.thumbnailUrl.toLowerCase().includes('.mp4')
                    ? activeMedia.thumbnailUrl
                    : getVideoPosterUrl(activeMedia.originalUrl || activeMedia.optimizedUrl || '')
                }
                preload="metadata"
                loop
                playsInline
                muted={isMuted}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Sound Toggle Button (Floating bottom right) */}
              <button
                onClick={toggleMute}
                className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md border z-20 transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                  !isMuted
                    ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-200 shadow-amber-400/30'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20'
                }`}
                title={isMuted ? 'Turn Sound ON' : 'Turn Sound OFF'}
              >
                {!isMuted ? (
                  <>
                    <Volume2 className="w-4 h-4 text-black animate-pulse" />
                    <span className="text-[10px] font-extrabold text-black">Sound ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 text-rose-300" />
                    <span className="text-[10px] font-bold text-rose-200">Muted</span>
                  </>
                )}
              </button>

              {/* Play / Pause Indicator Overlay */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none"
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      startPlaying();
                    }}
                    className="w-14 h-14 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-2xl hover:scale-110 hover:bg-amber-400 hover:text-black transition-all cursor-pointer pointer-events-auto"
                  >
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  </div>
                </div>
              )}

              {/* Video Indicator Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] text-white/90 font-medium pointer-events-none">
                <Film className="w-3 h-3 text-amber-400" />
                <span>Reel {!isMuted ? '· 🔊 Audio ON' : ''}</span>
              </div>
            </div>
          ) : (
            <img
              src={activeMedia.optimizedUrl || activeMedia.originalUrl}
              alt={post.caption}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          )
        ) : (
          <div className="text-white/40 text-sm">Media unavailable</div>
        )}

        {/* Double-tap Heart Animation */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <Heart className="w-24 h-24 text-rose-500 fill-rose-500 animate-heart-pop drop-shadow-2xl" />
          </div>
        )}

        {/* Carousel Navigation Arrows */}
        {mediaList.length > 1 && (
          <>
            {currentMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev - 1);
                }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {currentMediaIndex < mediaList.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev + 1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {/* Carousel Dots */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
              {mediaList.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    idx === currentMediaIndex
                      ? 'w-4 bg-amber-400'
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              type="button"
              onClick={() => onToggleLike(post.id)}
              className="p-2 -m-2 group cursor-pointer transition-transform active:scale-125 touch-manipulation select-none flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  post.isLiked
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-white/80 group-hover:text-rose-400'
                }`}
              />
            </button>

            {/* Comment */}
            <button
              type="button"
              onClick={() => setShowAllComments(!showAllComments)}
              className="p-2 -m-2 text-white/80 hover:text-white transition-colors cursor-pointer touch-manipulation select-none flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: 'MediaGram Post', url: window.location.href });
                }
              }}
              className="p-2 -m-2 text-white/80 hover:text-white transition-colors cursor-pointer touch-manipulation select-none flex items-center justify-center min-w-[40px] min-h-[40px]"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => onToggleBookmark(post.id)}
            className="p-2 -m-2 text-white/80 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation select-none flex items-center justify-center min-w-[40px] min-h-[40px]"
          >
            <Bookmark
              className={`w-6 h-6 ${
                post.isBookmarked ? 'text-amber-400 fill-amber-400' : ''
              }`}
            />
          </button>
        </div>

        {/* Likes Count */}
        <p className="text-xs font-bold text-white">
          {post.likesCount.toLocaleString()} {post.likesCount === 1 ? 'like' : 'likes'}
        </p>

        {/* Caption & Hashtags */}
        <div className="text-xs space-y-1">
          <span className="font-bold text-white mr-2">{post.user.username}</span>
          <span className="text-white/90 leading-relaxed">{post.caption}</span>
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {post.tags.map((t) => (
                <span key={t} className="text-amber-400/80 hover:text-amber-300 cursor-pointer">
                  #{t.replace('#', '')}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        {post.comments && post.comments.length > 0 && (
          <div className="space-y-1 pt-1">
            {post.comments.length > 2 && !showAllComments && (
              <button
                onClick={() => setShowAllComments(true)}
                className="text-[11px] text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                View all {post.comments.length} comments
              </button>
            )}

            {(showAllComments ? post.comments : post.comments.slice(-2)).map((c) => (
              <div key={c.id} className="text-xs flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-white mr-1.5">
                    {c.user?.username || 'user'}
                  </span>
                  <span className="text-white/80">{c.content}</span>
                </div>
                <span className="text-[10px] text-white/40 shrink-0">
                  {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-white/40 uppercase tracking-wider pt-1">
          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
        </p>

        {/* Add Comment Input Form */}
        <form
          onSubmit={handleCommentSubmit}
          className="pt-2 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none"
          />
          {commentText.trim() && (
            <button
              type="submit"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
            >
              Post
            </button>
          )}
        </form>
      </div>
    </article>
  );
}
