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
  Sparkles,
  Volume2,
  VolumeX,
  Play,
  Film,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { getVideoPosterUrl } from '@/lib/cloudinary';
import { store } from '@/lib/store';
import { videoCoordinator } from '@/lib/video-coordinator';

interface PostCardProps {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onPostDeleted?: (postId: string) => void;
  onPostEdited?: (postId: string, caption: string) => void;
}

export function PostCard({
  post,
  currentUser,
  onToggleLike,
  onToggleBookmark,
  onAddComment,
  onPostDeleted,
  onPostEdited,
}: PostCardProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showHeartPop, setShowHeartPop] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editCaption, setEditCaption] = useState(post.caption);

  // Central Video Coordinator: strictly one video plays, unmuted when watched
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(() => videoCoordinator.isSoundOn());
  const isManuallyPausedRef = useRef<boolean>(false);
  // Tracks if this is a fresh scroll-in activation (should reset to 0) vs user resume
  const isScrollActivationRef = useRef<boolean>(true);

  // Sync sound preference across all posts
  useEffect(() => {
    return videoCoordinator.subscribe(() => {
      setIsSoundOn(videoCoordinator.isSoundOn());
    });
  }, []);

  // Dynamic Follow state synced with platform store
  const [isFollowing, setIsFollowing] = useState<boolean>(() =>
    typeof store.isFollowing === 'function' ? store.isFollowing(post.user.id) : false
  );

  const isOwnPost = post.userId === currentUser.id;

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

  // Touch tracking — use touchstart for more accurate timing on mobile
  const touchStartTimeRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const mediaList = post.media || [];
  const activeMedia = mediaList[currentMediaIndex];

  // Register with central video coordinator: strictly one video plays, unmuted when watched
  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video || !container || activeMedia?.resourceType !== 'video') return;

    const unregister = videoCoordinator.register({
      id: post.id,
      element: container,
      video: video,
      onActivate: (unmuted) => {
        setIsPlaying(true);
        // Only restart from beginning on scroll-in activation, NOT when user manually resumes
        if (isScrollActivationRef.current) {
          try {
            video.currentTime = 0;
          } catch (_) {}
        }
        isScrollActivationRef.current = false; // subsequent activations are not scroll-fresh
        video.loop = true;
        video.playsInline = true;
        if (unmuted) {
          video.muted = false;
          video.volume = 1.0;
        } else {
          video.muted = true;
        }
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Browser policy blocked unmuted autoplay before first user gesture:
            video.muted = true;
            video.play().then(() => setIsPlaying(true)).catch(() => {});
          });
        }
      },
      onDeactivate: () => {
        video.pause();
        isScrollActivationRef.current = true;
        setIsPlaying(false);
        video.muted = true;
      },
      isManuallyPaused: () => isManuallyPausedRef.current,
      resetManualPause: () => {
        isManuallyPausedRef.current = false;
      },
    });

    return () => unregister();
  }, [post.id, activeMedia?.resourceType, currentMediaIndex]);

  const startPlaying = () => {
    const video = videoRef.current;
    if (!video) return;
    isManuallyPausedRef.current = false;
    isScrollActivationRef.current = false;

    // Enforce strictly that only THIS video plays across the entire page
    videoCoordinator.playVideo(post.id);

    video.muted = !videoCoordinator.isSoundOn();
    video.volume = videoCoordinator.isSoundOn() ? 1.0 : 0;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          video.muted = true;
          video.play().then(() => setIsPlaying(true)).catch(() => {});
        });
    } else {
      setIsPlaying(true);
    }
  };

  const pauseVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    isManuallyPausedRef.current = true;
    video.pause();
    setIsPlaying(false);
    videoCoordinator.onVideoManuallyPaused(post.id);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSound = videoCoordinator.toggleSound();
    const video = videoRef.current;
    if (video) {
      video.muted = !nextSound;
      video.volume = nextSound ? 1.0 : 0;
      if (video.paused && nextSound) {
        startPlaying();
      }
    }
  };

  const handleDoubleTap = () => {
    if (!post.isLiked) {
      onToggleLike(post.id);
    }
    setShowHeartPop(true);
    setTimeout(() => setShowHeartPop(false), 800);
  };

  // --- Mobile-safe touch handling ---
  // We track touchstart time so that we can distinguish:
  //   single tap  → toggle play/pause (video) or open lightbox (image)
  //   double tap  → like (within 300ms of previous tap)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const now = Date.now();
    // Only treat as tap if the finger lifted quickly (< 200ms hold)
    const holdDuration = now - touchStartTimeRef.current;
    if (holdDuration > 200) return; // Long-press, ignore

    const timeSinceLastTap = now - lastTapTimeRef.current;

    if (timeSinceLastTap > 0 && timeSinceLastTap < 300) {
      // Double-tap detected
      e.preventDefault(); // prevent synthesized click
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleDoubleTap();
      return;
    }

    lastTapTimeRef.current = now;

    // Schedule single-tap action
    if (activeMedia?.resourceType === 'video') {
      clickTimeoutRef.current = setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          startPlaying();
        } else {
          pauseVideo();
        }
        clickTimeoutRef.current = null;
      }, 310); // > double-tap window so it won't fire on double-tap
    }
  };

  // Desktop click handler (for mouse)
  const handleMediaClick = (e: React.MouseEvent) => {
    // On touch devices, touchend handles it; skip synthesized clicks
    if (e.nativeEvent instanceof MouseEvent && (e.nativeEvent as any).sourceCapabilities?.firesTouchEvents === false) {
      // actual mouse click on non-touch device
    } else if (typeof TouchEvent !== 'undefined') {
      // On touch devices the synthesized click fires after touchend, skip it
      return;
    }

    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastTapTimeRef.current;

    if (timeDiff > 0 && timeDiff < 300) {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      lastTapTimeRef.current = 0;
      handleDoubleTap();
      return;
    }

    lastTapTimeRef.current = now;

    if (activeMedia?.resourceType === 'video') {
      clickTimeoutRef.current = setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          startPlaying();
        } else {
          pauseVideo();
        }
        clickTimeoutRef.current = null;
      }, 310);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
    setShowAllComments(true);
  };

  const handleDeletePost = () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      store.deletePost(post.id);
      onPostDeleted?.(post.id);
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    } catch (err: any) {
      alert(err.message || 'Could not delete post.');
    }
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    if (!editCaption.trim()) return;
    try {
      store.updatePost(post.id, { caption: editCaption.trim() });
      onPostEdited?.(post.id, editCaption.trim());
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    } catch (err: any) {
      alert(err.message || 'Could not update post.');
    }
    setIsEditing(false);
    setShowMenu(false);
  };

  return (
    <article id={`post-${post.id}`} className="glass-card overflow-hidden border border-white/10 mb-6 relative">
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

        <div className="flex items-center gap-2 relative">
          {activeMedia && <CloudinaryBadge media={activeMedia} />}
          <button
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Three-dot dropdown menu */}
          {showMenu && (
            <div className="absolute top-8 right-0 z-50 glass-card border border-white/15 rounded-xl py-1.5 min-w-[140px] shadow-2xl">
              {isOwnPost && (
                <>
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => { setIsEditing(true); setEditCaption(post.caption); setShowMenu(false); }}
                  >
                    <Pencil className="w-3.5 h-3.5 text-amber-400" />
                    Edit Caption
                  </button>
                  <button
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    onClick={handleDeletePost}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Post
                  </button>
                  <div className="border-t border-white/10 my-1" />
                </>
              )}
              <button
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                onClick={() => setShowMenu(false)}
              >
                <X className="w-3.5 h-3.5" />
                Close
              </button>
            </div>
          )}
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

      {/* Inline Edit Caption */}
      {isEditing && (
        <div className="px-4 py-3 border-b border-amber-400/20 bg-amber-400/5">
          <p className="text-[10px] text-amber-300 font-bold mb-1.5">EDITING CAPTION</p>
          <textarea
            className="w-full bg-black/30 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 resize-none"
            rows={3}
            value={editCaption}
            onChange={(e) => setEditCaption(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 text-black text-[11px] font-bold hover:bg-amber-300 transition-colors cursor-pointer"
              onClick={handleSaveEdit}
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-[11px] font-bold hover:bg-white/20 transition-colors cursor-pointer"
              onClick={() => setIsEditing(false)}
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Media Carousel / Single Asset */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/5] sm:aspect-square bg-black/60 overflow-hidden select-none cursor-pointer flex items-center justify-center group"
        onClick={handleMediaClick}
        onTouchStart={handleTouchStart}
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
                muted={!isSoundOn}
                onPlay={() => {
                  setIsPlaying(true);
                  videoCoordinator.onVideoStartedPlaying(post.id, videoRef.current);
                }}
                onPause={() => {
                  setIsPlaying(false);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                }}
                className="w-full h-full object-cover cursor-pointer"
              />

              {/* Sound Toggle Button (Floating bottom right) */}
              <button
                type="button"
                onClick={toggleMute}
                className={`absolute bottom-3 right-3 px-3 py-1.5 rounded-full backdrop-blur-md border z-20 transition-all cursor-pointer shadow-lg flex items-center gap-1.5 ${
                  isSoundOn
                    ? 'bg-amber-400 hover:bg-amber-300 text-black border-amber-200 shadow-amber-400/30'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20'
                }`}
                title={isSoundOn ? 'Turn Sound OFF' : 'Turn Sound ON'}
              >
                {isSoundOn ? (
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px] pointer-events-none">
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
                <span>Reel {isSoundOn ? '· 🔊 Audio ON' : ''}</span>
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

        {/* Heart pop animation overlay */}
        {showHeartPop && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div className="animate-ping w-20 h-20 flex items-center justify-center">
              <span className="text-5xl drop-shadow-2xl" aria-hidden>❤️</span>
            </div>
          </div>
        )}

        {/* Carousel: Previous */}
        {mediaList.length > 1 && currentMediaIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((i) => i - 1); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all z-10 shadow-xl"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Carousel: Next */}
        {mediaList.length > 1 && currentMediaIndex < mediaList.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex((i) => i + 1); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/90 transition-all z-10 shadow-xl"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Carousel Dots */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
            {mediaList.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  idx === currentMediaIndex ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
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
              className="p-2 -m-2 group cursor-pointer transition-transform active:scale-125 touch-manipulation select-none flex items-center justify-center min-w-[44px] min-h-[44px]"
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
              className="p-2 -m-2 text-white/80 hover:text-white transition-colors cursor-pointer touch-manipulation select-none flex items-center justify-center min-w-[44px] min-h-[44px]"
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
              className="p-2 -m-2 text-white/80 hover:text-white transition-colors cursor-pointer touch-manipulation select-none flex items-center justify-center min-w-[44px] min-h-[44px]"
            >
              <Share2 className="w-6 h-6" />
            </button>
          </div>

          {/* Bookmark */}
          <button
            type="button"
            onClick={() => onToggleBookmark(post.id)}
            className="p-2 -m-2 text-white/80 hover:text-amber-400 transition-colors cursor-pointer touch-manipulation select-none flex items-center justify-center min-w-[44px] min-h-[44px]"
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
