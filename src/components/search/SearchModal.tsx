'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlassAvatar } from '../glass/GlassAvatar';
import { GlassInput } from '../glass/GlassInput';
import { store } from '@/lib/store';
import { User, Post } from '@/lib/types';
import {
  Search,
  X,
  MessageSquare,
  UserCheck,
  Sparkles,
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'posts'>('accounts');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (query.trim() === '' && !selectedTag) {
      // Show top active accounts by default
      setUserResults(store.searchUsers('', 24));
      setPostResults([]);
    } else {
      const q = selectedTag ? selectedTag : query;
      const res = store.search(q);
      setUserResults(res.users);
      setPostResults(res.posts);
    }
  }, [query, selectedTag, isOpen]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedTag(null);
      setActiveTab('accounts');
      setUserResults(store.searchUsers('', 24));
      setPostResults([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const popularTags = ['photography', 'travel', 'cinematics', 'cyberpunk', 'design', 'fashion'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl glass border border-white/20 bg-[#0d0f19]/95 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Search MediaGram</h2>
              <p className="text-[11px] text-white/50">Browse creators, customers, and posts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="p-4 border-b border-white/10 space-y-3 bg-white/[0.02]">
          <div className="relative">
            <GlassInput
              icon={<Search className="w-4 h-4 text-amber-400" />}
              placeholder="Search by name, @username, or keywords (e.g. Alex, Sophia, travel)..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedTag(null);
              }}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] text-white/40 uppercase font-mono mr-1 shrink-0">Tags:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTag === tag) {
                    setSelectedTag(null);
                  } else {
                    setSelectedTag(tag);
                    setQuery('');
                  }
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'bg-amber-400 text-black shadow-md font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center px-4 pt-1 border-b border-white/5 bg-black/20">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'accounts' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            Accounts ({userResults.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'posts' ? 'border-amber-400 text-amber-400' : 'border-transparent text-white/50 hover:text-white/80'
            }`}
          >
            Posts ({postResults.length})
          </button>
        </div>

        {/* Results Info */}
        <div className="px-4 py-2 bg-black/20 border-b border-white/5 flex items-center justify-between text-[11px] text-white/50">
          <span>{query || selectedTag ? `Results for "${query || selectedTag}"` : 'Suggested Active Accounts'}</span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-white/5">
          {activeTab === 'accounts' && (
            <>
              {userResults.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                <Users className="w-8 h-8 text-white/30 mx-auto" />
                <p className="text-xs font-semibold text-white/70">No matching accounts found</p>
                <p className="text-[11px] text-white/40">Try searching for &quot;Alex&quot;, &quot;Sophia&quot;, &quot;Marcus&quot;, or &quot;Elena&quot;</p>
              </div>
            ) : (
            userResults.map((user) => (
              <div
                key={user.id}
                className="pt-2 first:pt-0 flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] transition-colors group"
              >
                {/* User Info Link */}
                <Link
                  href={`/profile/${user.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 overflow-hidden flex-1 mr-3"
                >
                  <GlassAvatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="md"
                    isVerified={user.isVerified}
                  />
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {user.name}
                      </p>
                    </div>
                    <p className="text-[11px] text-white/50 truncate">@{user.username}</p>
                    {user.bio && (
                      <p className="text-[10px] text-white/60 line-clamp-1 mt-0.5">{user.bio}</p>
                    )}
                  </div>
                </Link>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onClose();
                      router.push(`/messages?chatWith=${user.username}`);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                    title="Send Direct Message"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-[11px]">Message</span>
                  </button>

                  <Link
                    href={`/profile/${user.username}`}
                    onClick={onClose}
                    className="p-2 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-black text-xs font-bold transition-all"
                    title="View Profile"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
              )}
            </>
          )}

          {activeTab === 'posts' && (
            <>
              {postResults.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Compass className="w-8 h-8 text-white/30 mx-auto" />
                <p className="text-xs font-semibold text-white/70">No matching posts found</p>
                <p className="text-[11px] text-white/40">Try searching for other tags or keywords</p>
              </div>
            ) : (
              postResults.map((post) => (
                <div
                  key={post.id}
                  className="pt-2 first:pt-0 flex items-start p-2.5 rounded-2xl hover:bg-white/[0.06] transition-colors group"
                >
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-black/50 border border-white/10 mr-3">
                    {post.media[0] && (
                      post.media[0].resourceType === 'video' || post.isReel ? (
                        <video
                          src={post.media[0].optimizedUrl || post.media[0].originalUrl}
                          poster={post.media[0].thumbnailUrl && !post.media[0].thumbnailUrl.toLowerCase().includes('.mp4') ? post.media[0].thumbnailUrl : '/pics/pic_01.jpg'}
                          className="w-full h-full object-cover"
                          preload="metadata"
                          muted
                        />
                      ) : (
                        <img
                          src={post.media[0].thumbnailUrl || post.media[0].originalUrl || '/pics/pic_01.jpg'}
                          className="w-full h-full object-cover"
                          alt="Post preview"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => { e.currentTarget.src = '/pics/pic_01.jpg'; }}
                        />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${post.user.username}`}
                      onClick={onClose}
                      className="text-xs font-bold text-white hover:text-amber-300 transition-colors inline-block mb-0.5"
                    >
                      @{post.user.username}
                    </Link>
                    <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                      {post.caption}
                    </p>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 overflow-hidden">
                        {post.tags.slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 whitespace-nowrap">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
              )}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 border-t border-white/10 bg-black/40 text-center">
          <p className="text-[11px] text-white/40">
            Search across 1,000+ creators, photographers, and visual artists
          </p>
        </div>
      </div>
    </div>
  );
}
