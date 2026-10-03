'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Post, Reel } from '@/lib/types';
import { GlassAvatar } from '../glass/GlassAvatar';
import { GlassButton } from '../glass/GlassButton';
import { GlassModal } from '../glass/GlassModal';
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
  Cloud
} from 'lucide-react';

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [selectedReel, setSelectedReel] = useState<Reel | null>(null);
  const isOwnProfile = user.id === currentUser.id;

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
                    onClick={() => setIsFollowing(!isFollowing)}
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
        {['Tokyo 🌃', 'Reflections ✨', 'Gear 🎥', 'Presets 🎨'].map((highlight, i) => (
          <div key={highlight} className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group">
            <div className="w-16 h-16 rounded-full p-[2px] bg-white/20 group-hover:bg-amber-400/80 transition-colors">
              <div className="w-full h-full rounded-full bg-black/60 overflow-hidden border-2 border-[#06070c]">
                <img
                  src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000000}?w=120&h=120&fit=crop`}
                  alt={highlight}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-white/70">{highlight}</span>
          </div>
        ))}
      </div>

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
          userPosts.length > 0 ? (
            userPosts.map((post) => {
              const firstMedia = post.media[0];
              const isVideo = firstMedia?.resourceType === 'video' || post.isReel;
              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-square group overflow-hidden rounded-xl bg-black/40 cursor-pointer border border-white/5 hover:border-amber-400/40 transition-colors"
                >
                  {isVideo ? (
                    <video
                      src={`${firstMedia?.optimizedUrl || firstMedia?.originalUrl}#t=0.001`}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={firstMedia?.thumbnailUrl || firstMedia?.originalUrl}
                      alt={post.caption}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {/* Indicator for video or multiple photos */}
                  {isVideo ? (
                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-amber-300 backdrop-blur-sm">
                      <Film className="w-3.5 h-3.5" />
                    </div>
                  ) : post.media.length > 1 ? (
                    <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white backdrop-blur-sm">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  ) : null}

                  {/* Hover Overlay with Likes & Comments */}
                  <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold text-sm backdrop-blur-[2px]">
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
            userReels.map((reel) => (
              <div
                key={reel.id}
                onClick={() => setSelectedReel(reel)}
                className="relative aspect-[9/16] group overflow-hidden rounded-xl bg-black/40 cursor-pointer border border-white/5 hover:border-purple-400/50 transition-colors"
              >
                <video
                  src={`${reel.videoUrl}#t=0.001`}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                />
                <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-purple-300 backdrop-blur-sm">
                  <Film className="w-3.5 h-3.5" />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/80 flex items-center justify-center text-white shadow-lg">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white text-xs font-bold drop-shadow bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-sm">
                  <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                  <span>{reel.likesCount}</span>
                </div>
              </div>
            ))
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
          bookmarkedPosts.length > 0 ? (
            bookmarkedPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="relative aspect-square group overflow-hidden rounded-xl bg-black/40 cursor-pointer border border-white/5 hover:border-cyan-400/40 transition-colors"
              >
              {post.isReel || post.media[0]?.resourceType === 'video' ? (
                <video
                  src={`${post.media[0]?.optimizedUrl || post.media[0]?.originalUrl}#t=0.001`}
                  preload="metadata"
                  muted
                  playsInline
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none"
                />
              ) : (
                <img
                  src={post.media[0]?.thumbnailUrl || post.media[0]?.originalUrl}
                  alt={post.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              )}
            </div>
            ))
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

      {/* Selected Reel Modal Player */}
      {selectedReel && (
        <GlassModal
          isOpen={!!selectedReel}
          onClose={() => setSelectedReel(null)}
          title={`Reel by @${user.username}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="relative aspect-[9/16] max-h-[520px] mx-auto rounded-2xl overflow-hidden bg-black border border-white/20 shadow-2xl flex items-center justify-center">
              <video
                src={selectedReel.videoUrl}
                poster={selectedReel.posterUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <GlassAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="sm"
                    isVerified={user.isVerified}
                  />
                  <div>
                    <p className="text-xs font-bold text-white">@{user.username}</p>
                    <p className="text-[10px] text-white/50">{selectedReel.audioTrackTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/70 flex items-center gap-1 font-semibold">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    {selectedReel.likesCount}
                  </span>
                  <Link href="/reels">
                    <button className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
                      <Film className="w-3.5 h-3.5" />
                      Open Fullscreen Reels
                    </button>
                  </Link>
                </div>
              </div>
              <p className="text-xs text-white/90 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/10">
                {selectedReel.caption}
              </p>
            </div>
          </div>
        </GlassModal>
      )}

      {/* Selected Post Modal Viewer */}
      {selectedPost && (
        <GlassModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title={`Post by @${user.username}`}
          maxWidth="4xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-black/80 flex items-center justify-center border border-white/10">
              {selectedPost.media[0]?.resourceType === 'video' || selectedPost.isReel ? (
                <video
                  src={selectedPost.media[0]?.optimizedUrl || selectedPost.media[0]?.originalUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedPost.media[0]?.optimizedUrl || selectedPost.media[0]?.originalUrl}
                  alt={selectedPost.caption}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                  <GlassAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="sm"
                    isVerified={user.isVerified}
                  />
                  <div>
                    <p className="text-xs font-bold text-white">{user.name}</p>
                    <p className="text-[10px] text-white/50">@{user.username}</p>
                  </div>
                </div>
                <p className="text-xs text-white/90 leading-relaxed max-h-48 overflow-y-auto">
                  {selectedPost.caption}
                </p>
                {selectedPost.tags && selectedPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedPost.tags.map((tag) => (
                      <span key={tag} className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-white font-semibold">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    {selectedPost.likesCount} likes
                  </span>
                  <span className="flex items-center gap-1 text-white/70">
                    <MessageCircle className="w-4 h-4 text-amber-400" />
                    {selectedPost.commentsCount} comments
                  </span>
                </div>
                <span className="text-[10px] text-white/40">
                  {new Date(selectedPost.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
