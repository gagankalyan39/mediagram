'use client';

import React, { useState } from 'react';
import { Post, User } from '@/lib/types';
import { Search, Film, Layers, Heart, MessageCircle, TrendingUp, Users, Play, Link as LinkIcon } from 'lucide-react';
import { GlassInput } from '../glass/GlassInput';
import { GlassAvatar } from '../glass/GlassAvatar';
import { store } from '@/lib/store';
import Link from 'next/link';
import { getVideoPosterUrl } from '@/lib/cloudinary';

interface ExploreGridProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

export function ExploreGrid({ posts, onSelectPost }: ExploreGridProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeSearchFilter, setActiveSearchFilter] = useState<'all' | 'accounts' | 'videos'>('all');

  const trendingTags = ['tokyo', 'cyberpunk', 'glassmorphism', 'aerialvideo', 'surfing', 'mountains', 'cinema'];

  // Fast memoized search for accounts
  const matchedUsers = React.useMemo(() => {
    if (activeSearchFilter !== 'accounts' && !search.trim()) return [];
    return store.searchUsers(search, 24);
  }, [search, activeSearchFilter]);

  // Fast memoized search for posts
  const filteredPosts = React.useMemo(() => {
    const s = search.toLowerCase().trim();
    return posts.filter((p) => {
      const matchesSearch =
        !s ||
        p.caption.toLowerCase().includes(s) ||
        p.user.username.toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s));

      const matchesTag = !selectedTag || p.tags.includes(selectedTag);
      const matchesVideoOnly = activeSearchFilter !== 'videos' || p.isReel || p.media[0]?.resourceType === 'video';

      return matchesSearch && matchesTag && matchesVideoOnly;
    });
  }, [posts, search, selectedTag, activeSearchFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Search Header & Filter Tabs */}
      <div className="space-y-3">
        <GlassInput
          icon={<Search className="w-4 h-4" />}
          placeholder="Search accounts, #hashtags, or video reels..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
            {(['all', 'accounts', 'videos'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveSearchFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeSearchFilter === filter
                    ? 'bg-amber-400 text-black shadow-sm font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {filter === 'videos' ? '🎥 Videos & Reels' : filter}
              </button>
            ))}
          </div>

          {/* Trending Tags */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1 text-xs text-amber-400 font-bold px-1 shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Trending:</span>
            </div>
            {trendingTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-amber-400 text-black shadow-md'
                    : 'bg-white/[0.05] text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Account Results (Shown when searching or when Accounts filter is selected) */}
      {(search.trim().length > 0 || activeSearchFilter === 'accounts') && (
        <div className="space-y-3 p-4 rounded-2xl glass border border-white/10">
          <div className="flex items-center justify-between text-xs font-bold text-white/70">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              Accounts ({matchedUsers.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matchedUsers.map((user) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <GlassAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="md"
                    isVerified={user.isVerified}
                  />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">@{user.username}</p>
                    <span className="text-[10px] text-white/40">
                      {user.followersCount.toLocaleString()} followers
                    </span>
                  </div>
                </div>

                <span className="text-xs font-semibold text-cyan-400 group-hover:underline flex items-center gap-1">
                  View Profile
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Instagram Explore Media Grid (Photos & Videos) */}
      {activeSearchFilter !== 'accounts' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {filteredPosts.map((post, idx) => {
            const media = post.media[0];
            const isVideo = post.isReel || media?.resourceType === 'video';
            const isLarge = idx % 5 === 0;

            return (
              <div
                key={post.id}
                onClick={() => onSelectPost(post)}
                className={`relative group rounded-2xl overflow-hidden glass border border-white/10 cursor-pointer bg-black/40 ${
                  isLarge ? 'md:row-span-2 aspect-[4/5] md:aspect-auto' : 'aspect-square'
                }`}
              >
                {/* Media Image / Video Thumbnail */}
                {isVideo ? (
                  <video
                    src={media?.optimizedUrl || media?.originalUrl}
                    poster={media?.thumbnailUrl && !media.thumbnailUrl.toLowerCase().includes('.mp4') ? media.thumbnailUrl : getVideoPosterUrl(media?.originalUrl || '')}
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
                    src={media?.thumbnailUrl || media?.originalUrl || '/pics/pic_01.jpg'}
                    alt={post.caption}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => { e.currentTarget.src = '/pics/pic_01.jpg'; }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}

                {/* Video Play Badge or Carousel Indicator */}
                <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/70 text-white backdrop-blur-sm">
                  {isVideo ? (
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  ) : post.media.length > 1 ? (
                    <Layers className="w-3.5 h-3.5" />
                  ) : null}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-4 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold drop-shadow">@{post.user.username}</span>
                  </div>

                  <div className="flex items-center justify-center gap-6 font-bold text-sm">
                    <div className="flex items-center gap-1.5">
                      <Heart className="w-5 h-5 fill-white" />
                      <span>{post.likesCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-5 h-5 fill-white" />
                      <span>{post.commentsCount}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-white/90 line-clamp-1 drop-shadow font-medium">
                    {post.caption}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
