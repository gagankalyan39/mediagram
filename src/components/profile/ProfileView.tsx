'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Post, Reel } from '@/lib/types';
import { GlassAvatar } from '../glass/GlassAvatar';
import { GlassButton } from '../glass/GlassButton';
import { GlassModal } from '../glass/GlassModal';
import { PostCard } from '../feed/PostCard';
import { store } from '@/lib/store';
import {
  Grid,
  Film,
  Bookmark,
  Heart,
  MessageCircle,
  Copy,
  Layers,
  Settings,
  Shield,
  Sparkles,
  Link as LinkIcon,
  Camera,
  Play,
  Cloud,
  ArrowLeft
} from 'lucide-react';
import { getVideoPosterUrl } from '@/lib/cloudinary';

interface ProfileViewProps {
  user: User;
  currentUser: User;
  userPosts: Post[];
  userReels: Reel[];
  bookmarkedPosts: Post[];
  onOpenAccountSwitcher: () => void;
  onToggleLike: (postId: string) => void;
}

export function ProfileView({
  user,
  currentUser,
  userPosts,
  userReels,
  bookmarkedPosts,
  onOpenAccountSwitcher,
  onToggleLike,
}: ProfileViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('grid');
  const [targetPostId, setTargetPostId] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean>(() =>
    typeof store.isFollowing === 'function' ? store.isFollowing(user.id) : false
  );
  const [posts, setPosts] = useState<Post[]>(userPosts);
  const [savedPosts, setSavedPosts] = useState<Post[]>(bookmarkedPosts);
  const isOwnProfile = user.id === currentUser.id;

  useEffect(() => {
    if (typeof store.isFollowing === 'function') {
      setIsFollowing(store.isFollowing(user.id));
    }
    const handleUpdate = () => {
      if (typeof store.isFollowing === 'function') {
        setIsFollowing(store.isFollowing(user.id));
      }
    };
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, [user.id]);

  useEffect(() => {
    setPosts(userPosts);
  }, [userPosts]);

  useEffect(() => {
    setSavedPosts(bookmarkedPosts);
  }, [bookmarkedPosts]);

  // DSA Helper: Convert video Reel to full Post structure in O(1) time
  const reelToPost = (reel: Reel): Post => ({
    id: reel.postId || `post_${reel.id}`,
    userId: reel.userId,
    user: reel.user,
    caption: reel.caption || '',
    location: 'Location Reel',
    visibility: 'public',
    isReel: true,
    media: [
      {
        id: `media_${reel.id}`,
        userId: reel.userId,
        postId: reel.postId || `post_${reel.id}`,
        assetId: `cld_${reel.id}`,
        publicId: `mediagram/reels/${reel.id}`,
        resourceType: 'video' as const,
        format: 'mp4',
        width: 1080,
        height: 1920,
        duration: reel.duration,
        bytes: 8500000,
        originalUrl: reel.videoUrl,
        thumbnailUrl: reel.posterUrl,
        optimizedUrl: reel.videoUrl,
        folder: 'mediagram/reels',
        tags: ['reel', 'video'],
        createdAt: reel.createdAt,
      },
    ],
    likesCount: reel.likesCount,
    commentsCount: reel.commentsCount,
    sharesCount: reel.sharesCount,
    isLiked: reel.isLiked,
    isBookmarked: reel.isBookmarked,
    tags: ['reel', 'video'],
    comments: [],
    createdAt: reel.createdAt,
  });

  // Dynamic feed posts depending on current tab
  const feedPosts: Post[] = useMemo(() => {
    if (activeTab === 'reels') {
      return userReels.map((reel) => {
        const found = posts.find((p) => p.id === reel.postId);
        return found || reelToPost(reel);
      });
    }
    if (activeTab === 'saved') {
      return savedPosts;
    }
    return posts;
  }, [activeTab, posts, userReels, savedPosts]);

  const handlePostClick = (postId: string) => {
    setTargetPostId(postId);
    setViewMode('feed');
  };

  const handleReelClick = (reel: Reel) => {
    const matched = posts.find((p) => p.id === reel.postId);
    const postToOpen = matched || reelToPost(reel);
    setTargetPostId(postToOpen.id);
    setViewMode('feed');
  };

  const handlePostLike = (postId: string) => {
    onToggleLike(postId);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = !p.isLiked;
          return { ...p, isLiked, likesCount: p.likesCount + (isLiked ? 1 : -1) };
        }
        return p;
      })
    );
  };

  const handlePostBookmark = (postId: string) => {
    const isBookmarked = store.toggleBookmarkPost(postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isBookmarked } : p))
    );
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handlePostComment = (postId: string, content: string) => {
    const newComment = store.addComment(postId, content);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [
              ...(p.comments || []),
              newComment,
            ],
          };
        }
        return p;
      })
    );
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  // Smoothly scroll to the clicked target post in feed view
  useEffect(() => {
    if (viewMode === 'feed' && targetPostId) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`profile-post-${targetPostId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [viewMode, targetPostId]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 border border-white/10 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="shrink-0">
          <GlassAvatar
            src={user.avatarUrl}
            name={user.name}
            size="xl"
            hasStory={true}
            isVerified={user.isVerified}
          />
        </div>

        {/* User Info & Actions */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              {user.username}
              {user.role === 'ADMIN' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  <Shield className="w-3 h-3 text-purple-400" />
                  ADMIN
                </span>
              )}
              {user.role === 'CREATOR' && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  CREATOR
                </span>
              )}
            </h1>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    onClick={onOpenAccountSwitcher}
                  >
                    Switch Account
                  </GlassButton>
                  <Link href="/settings">
                    <GlassButton size="icon" variant="ghost" title="Settings & Privacy">
                      <Settings className="w-4 h-4" />
                    </GlassButton>
                  </Link>
                </>
              ) : (
                <>
                  <GlassButton
                    size="sm"
                    variant={isFollowing ? 'secondary' : 'primary'}
                    onClick={() => {
                      const res = store.toggleFollow(user.id);
                      setIsFollowing(res);
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </GlassButton>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    onClick={() => router.push(`/messages?chatWith=${user.username}`)}
                  >
                    Message
                  </GlassButton>
                </>
              )}
            </div>
          </div>

          {/* Followers / Following / Posts Counts */}
          <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
            <div>
              <span className="font-bold text-white mr-1">{userPosts.length}</span>
              <span className="text-white/60">posts</span>
            </div>
            <div>
              <span className="font-bold text-white mr-1">
                {(user.followersCount + (isFollowing ? 1 : 0)).toLocaleString()}
              </span>
              <span className="text-white/60">followers</span>
            </div>
            <div>
              <span className="font-bold text-white mr-1">{user.followingCount}</span>
              <span className="text-white/60">following</span>
            </div>
          </div>

          {/* Name & Bio */}
          <div className="space-y-1">
            <p className="font-semibold text-white text-sm">{user.name}</p>
            {user.bio && (
              <p className="text-xs text-white/80 max-w-lg leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            )}
            {user.website && (
              <a
                href={user.website}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center justify-center md:justify-start gap-1 font-medium pt-1"
              >
                <LinkIcon className="w-3 h-3" />
                {user.website.replace('https://', '')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Profile Highlights Row */}
      <div className="flex items-center gap-6 overflow-x-auto px-2 scrollbar-none">
        {[
          { name: 'Tokyo 🌃', img: '/pics/pic_17.jpg' },
          { name: 'Reflections ✨', img: '/pics/pic_04.jpg' },
          { name: 'Gear 🎥', img: '/pics/pic_11.jpg' },
          { name: 'Presets 🎨', img: '/pics/pic_16.jpg' },
        ].map((highlight) => (
          <div key={highlight.name} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] bg-white/20 group-hover:bg-amber-400/80 transition-colors">
              <div className="w-full h-full rounded-full bg-black/60 overflow-hidden border-2 border-[#06070c]">
                <img
                  src={highlight.img}
                  alt={highlight.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-white/70">{highlight.name}</span>
          </div>
        ))}
      </div>

      {/* Conditional: Scrollable Feed View vs Standard 3-Column Profile Grid */}
      {viewMode === 'feed' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Sticky Navigation Bar */}
          <div className="sticky top-2 z-30 p-3.5 glass-card rounded-2xl border border-white/20 backdrop-blur-xl flex items-center justify-between shadow-2xl">
            <button
              onClick={() => {
                setViewMode('grid');
                setTargetPostId(null);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black text-white font-bold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 border border-white/15"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Profile Grid</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-white/50">Viewing feed of:</span>
              <span className="font-extrabold text-amber-300">@{user.username}</span>
              <span className="text-white/30">•</span>
              <span className="text-white/70 font-medium">{feedPosts.length} posts</span>
            </div>

            <button
              onClick={() => {
                setViewMode('grid');
                setTargetPostId(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors cursor-pointer border border-white/10"
              title="Return to Grid Layout"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
          </div>

          {/* Full Scrollable Feed of user's posts (just like home page) */}
          <div className="max-w-[540px] mx-auto space-y-6">
            {feedPosts.length > 0 ? (
              feedPosts.map((post) => (
                <div
                  key={post.id}
                  id={`profile-post-${post.id}`}
                  className="scroll-mt-24 transition-all"
                >
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    onToggleLike={handlePostLike}
                    onToggleBookmark={handlePostBookmark}
                    onAddComment={handlePostComment}
                  />
                </div>
              ))
            ) : (
              <div className="py-16 text-center text-white/50 text-xs">
                No posts shared by @{user.username} yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Tabs Header */}
          <div className="flex items-center justify-center border-t border-white/10 pt-2 gap-8 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 py-3 border-t-2 transition-all cursor-pointer ${
                activeTab === 'posts'
                  ? 'border-amber-400 text-white'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Posts</span>
            </button>

            <button
              onClick={() => setActiveTab('reels')}
              className={`flex items-center gap-2 py-3 border-t-2 transition-all cursor-pointer ${
                activeTab === 'reels'
                  ? 'border-purple-400 text-white'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Reels</span>
            </button>

            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex items-center gap-2 py-3 border-t-2 transition-all cursor-pointer ${
                  activeTab === 'saved'
                    ? 'border-cyan-400 text-white'
                    : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Saved</span>
              </button>
            )}
          </div>

          {/* 3-Column Media Grid */}
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {activeTab === 'posts' && (
              posts.length > 0 ? (
                posts.map((post) => {
                  const firstMedia = post.media[0];
                  const isVideo = firstMedia?.resourceType === 'video' || post.isReel || firstMedia?.originalUrl?.toLowerCase().includes('.mp4');
                  const posterFallback = firstMedia?.thumbnailUrl && !firstMedia.thumbnailUrl.toLowerCase().includes('.mp4')
                    ? firstMedia.thumbnailUrl
                    : getVideoPosterUrl(firstMedia?.originalUrl || firstMedia?.optimizedUrl || '');

                  return (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="relative aspect-square group overflow-hidden rounded-xl bg-black/40 cursor-pointer border border-white/5 hover:border-amber-400/40 transition-colors"
                    >
                      {isVideo ? (
                        <video
                          src={firstMedia?.optimizedUrl || firstMedia?.originalUrl}
                          poster={posterFallback}
                          preload="metadata"
                          muted
                          playsInline
                          loop
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-auto"
                        />
                      ) : (
                        <img
                          src={firstMedia?.thumbnailUrl || firstMedia?.originalUrl || '/pics/pic_01.jpg'}
                          alt={post.caption}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = '/pics/pic_01.jpg';
                          }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      )}

                      {/* Indicator for video or multiple photos */}
                      {isVideo ? (
                        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-amber-300 backdrop-blur-sm pointer-events-none">
                          <Film className="w-3.5 h-3.5" />
                        </div>
                      ) : post.media.length > 1 ? (
                        <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white backdrop-blur-sm pointer-events-none">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                      ) : null}

                      {/* Hover Overlay with Likes & Comments */}
                      <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm backdrop-blur-[2px] pointer-events-none">
                        <div className="flex items-center gap-1.5">
                          <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                          <span>{post.likesCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="w-5 h-5 fill-amber-400 text-amber-400" />
                          <span>{post.commentsCount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
                    <Camera className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-white/80">No posts shared yet</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">
                    When @{user.username} shares photos or feed updates, they will appear here.
                  </p>
                </div>
              )
            )}

            {activeTab === 'reels' && (
              userReels.length > 0 ? (
                userReels.map((reel) => {
                  const reelPoster = reel.posterUrl && !reel.posterUrl.toLowerCase().includes('.mp4')
                    ? reel.posterUrl
                    : getVideoPosterUrl(reel.videoUrl);
                  return (
                    <div
                      key={reel.id}
                      onClick={() => handleReelClick(reel)}
                      className="relative aspect-[9/16] group overflow-hidden rounded-xl bg-black/40 cursor-pointer border border-white/5 hover:border-purple-400/50 transition-colors"
                    >
                      <video
                        src={reel.videoUrl}
                        poster={reelPoster}
                        preload="metadata"
                        muted
                        playsInline
                        loop
                        onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                        onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-auto"
                      />
                      <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-purple-300 backdrop-blur-sm pointer-events-none">
                        <Film className="w-3.5 h-3.5" />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-purple-500/80 flex items-center justify-center text-white shadow-lg">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white text-xs font-bold drop-shadow bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm pointer-events-none">
                        <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>{reel.likesCount}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
                    <Film className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-white/80">No reels created yet</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">
                    When @{user.username} publishes vertical video reels, they will appear here.
                  </p>
                </div>
              )
            )}

            {activeTab === 'saved' && (
              savedPosts.length > 0 ? (
                savedPosts.map((post) => {
                  const firstMedia = post.media[0];
                  const isVideo = post.isReel || firstMedia?.resourceType === 'video' || firstMedia?.originalUrl?.toLowerCase().includes('.mp4');
                  const posterFallback = firstMedia?.thumbnailUrl && !firstMedia.thumbnailUrl.toLowerCase().includes('.mp4')
                    ? firstMedia.thumbnailUrl
                    : getVideoPosterUrl(firstMedia?.originalUrl || firstMedia?.optimizedUrl || '');
                  return (
                    <div
                      key={post.id}
                      onClick={() => handlePostClick(post.id)}
                      className="relative aspect-square group overflow-hidden rounded-xl bg-black/40 cursor-pointer border border-white/5 hover:border-cyan-400/40 transition-colors"
                    >
                      {isVideo ? (
                        <video
                          src={firstMedia?.optimizedUrl || firstMedia?.originalUrl}
                          poster={posterFallback}
                          preload="metadata"
                          muted
                          playsInline
                          loop
                          onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                          onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-auto"
                        />
                      ) : (
                        <img
                          src={firstMedia?.thumbnailUrl || firstMedia?.originalUrl || '/pics/pic_01.jpg'}
                          alt={post.caption}
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.src = '/pics/pic_01.jpg';
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
                    <Bookmark className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-white/80">Save photos and videos</p>
                  <p className="text-xs text-white/40 mt-1 max-w-xs">
                    Save posts to watch or revisit them anytime. Only you can see what you've saved.
                  </p>
                </div>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
