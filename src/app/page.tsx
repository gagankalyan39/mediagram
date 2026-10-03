'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { StoriesBar } from '@/components/feed/StoriesBar';
import { PostCard } from '@/components/feed/PostCard';
import { StoryViewerModal } from '@/components/feed/StoryViewerModal';
import { CreatePostModal } from '@/components/upload/CreatePostModal';
import { store } from '@/lib/store';
import { Post, User, Story } from '@/lib/types';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassAvatar } from '@/components/glass/GlassAvatar';
import { GlassButton } from '@/components/glass/GlassButton';
import {
  Sparkles,
  Cloud,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  SlidersHorizontal,
  X,
  Cpu,
  Eye,
  TrendingUp,
  Brain,
  Shuffle
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [posts, setPosts] = useState<Post[]>(store.getRawPosts());
  const [stories, setStories] = useState<Story[]>(store.getStories());
  const [allUsers, setAllUsers] = useState<User[]>(store.getAllUsers());
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [feedMode, setFeedMode] = useState<'discover' | 'latest' | 'popular'>('discover');
  const [isShuffling, setIsShuffling] = useState(false);
  const [isMLModalOpen, setIsMLModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const syncState = () => {
    const cur = store.getCurrentUser();
    setCurrentUser({ ...cur });
    setStories([...store.getStories()]);
    setAllUsers([...store.getAllUsers()]);
  };

  useEffect(() => {
    setIsMounted(true);
    store.loadFromStorage();
    syncState();
    // Instagram-style randomized discovery: shuffle dynamically on client mount & per user
    const randomized = store.getRandomizedPosts(store.getCurrentUser().id);
    setPosts(randomized);

    // Reset scroll to top (like Instagram on refresh)
    window.scrollTo({ top: 0, behavior: 'instant' });

    const handleUpdate = () => {
      syncState();
    };
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, [currentUser.id]);

  const handleShuffleFeed = () => {
    setIsShuffling(true);
    const randomized = store.getRandomizedPosts(currentUser.id);
    setPosts([...randomized]);
    setTimeout(() => setIsShuffling(false), 400);
  };

  const handleToggleLike = (postId: string) => {
    const res = store.toggleLikePost(postId);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isLiked: res.isLiked, likesCount: res.likesCount } : p))
    );
  };

  const handleToggleBookmark = (postId: string) => {
    const isBookmarked = store.toggleBookmarkPost(postId);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isBookmarked } : p))
    );
  };

  const handleAddComment = (postId: string, content: string) => {
    const newComment = store.addComment(postId, content);
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [...(p.comments || []), newComment],
            }
          : p
      )
    );
  };

  // Sort posts depending on feedMode
  const displayedPosts = [...posts].sort((a, b) => {
    if (feedMode === 'latest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (feedMode === 'popular') {
      return b.likesCount - a.likesCount;
    }
    // Default 'discover': preserves the randomized Instagram-style exploration shuffle
    return 0;
  });

  const suggestedUsers = allUsers.filter((u) => u.id !== currentUser.id && u.role !== 'ADMIN').slice(0, 3);

  if (!isMounted) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-10 h-10 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-xs text-white/50 font-mono tracking-wider animate-pulse">
            Loading MediaGram feed...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>

      <div className="flex flex-col lg:flex-row gap-8 justify-center items-start max-w-5xl mx-auto">
        {/* Main Feed Column */}
        <div className="w-full lg:max-w-[560px] space-y-5">
          {/* Instagram Top Stories Bar */}
          <StoriesBar
            stories={stories}
            currentUser={currentUser}
            onSelectStory={(index) => setActiveStoryIdx(index)}
            onAddStory={() => setIsAddStoryOpen(true)}
          />

          {/* Feed Mode Switcher (Instagram Dynamic Random Discovery vs Latest + Instant Shuffle) */}
          <div className="flex items-center justify-between p-1.5 rounded-2xl glass border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFeedMode('discover')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  feedMode === 'discover'
                    ? 'bg-gradient-to-r from-amber-400/20 via-rose-500/20 to-purple-600/30 text-white border border-white/15 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Discover (Random)</span>
              </button>

              <button
                onClick={() => setFeedMode('latest')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  feedMode === 'latest'
                    ? 'bg-white/15 text-white border border-white/15 shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Latest</span>
              </button>

              {/* Instant Dynamic Shuffle Button */}
              <button
                onClick={handleShuffleFeed}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-300 hover:text-emerald-100 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all cursor-pointer ${
                  isShuffling ? 'opacity-70 scale-95' : ''
                }`}
                title="Shuffle and explore random posts & reels"
              >
                <Shuffle className={`w-3.5 h-3.5 text-emerald-400 ${isShuffling ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Shuffle</span>
              </button>
            </div>

            <button
              onClick={() => setIsMLModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-purple-300 hover:text-purple-100 hover:bg-purple-500/10 transition-colors cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Algorithm Insights</span>
            </button>
          </div>

          {/* Posts Feed */}
          <div className="space-y-6">
            {displayedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                onAddComment={handleAddComment}
              />
            ))}
          </div>
        </div>

        {/* Right Rail Suggestions & Cloudinary Info (Desktop) */}
        <div className="hidden lg:block w-80 space-y-5 sticky top-6">
          {/* Active User Card */}
          <GlassCard className="p-4 border border-white/10 flex items-center justify-between">
            <Link
              href={`/profile/${currentUser.username}`}
              className="flex items-center gap-3 overflow-hidden"
            >
              <GlassAvatar
                src={currentUser.avatarUrl}
                name={currentUser.name}
                size="md"
                isVerified={currentUser.isVerified}
              />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-[11px] text-white/50 truncate">@{currentUser.username}</p>
                <span className="text-[10px] text-amber-400 font-bold uppercase">
                  {currentUser.role}
                </span>
              </div>
            </Link>

            <Link href={`/profile/${currentUser.username}`}>
              <GlassButton size="sm" variant="ghost" className="text-xs text-amber-400">
                View
              </GlassButton>
            </Link>
          </GlassCard>

          {/* Suggestions For You */}
          <GlassCard className="p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white/70">Suggested For You</span>
              <Link href="/explore" className="text-[11px] text-white/40 hover:text-white">
                See All
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {suggestedUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-2.5 overflow-hidden"
                  >
                    <GlassAvatar
                      src={user.avatarUrl}
                      name={user.name}
                      size="sm"
                      isVerified={user.isVerified}
                    />
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">{user.username}</p>
                      <p className="text-[10px] text-white/40 truncate">Suggested for you</p>
                    </div>
                  </Link>

                  <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Cloudinary Core Infrastructure Widget */}
          <GlassCard className="p-4 border border-cyan-500/25 space-y-3 bg-cyan-950/20" glow="cyan">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Cloudinary Core Engine</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-900/40 px-2 py-0.5 rounded border border-cyan-500/30">
                LIVE
              </span>
            </div>

            <div className="text-[11px] space-y-1.5 text-white/70">
              <p className="flex justify-between">
                <span>Cloud:</span>
                <span className="font-mono text-white font-semibold">rwcuzbxd</span>
              </p>
              <p className="flex justify-between">
                <span>Adaptive Delivery:</span>
                <span className="text-emerald-400 font-semibold">q_auto, f_auto</span>
              </p>
              <p className="flex justify-between">
                <span>Thumbnails:</span>
                <span className="text-amber-300 font-semibold">Dynamic crop</span>
              </p>
            </div>

            <Link
              href="/library"
              className="flex items-center justify-between pt-2 border-t border-white/10 text-xs text-cyan-300 hover:text-cyan-200 font-semibold"
            >
              <span>Explore Media Library</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </GlassCard>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {activeStoryIdx !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={activeStoryIdx}
          isOpen={activeStoryIdx !== null}
          onClose={() => setActiveStoryIdx(null)}
          onStorySeen={(id) => {
            store.markStorySeen(id);
            syncState();
          }}
        />
      )}

      {/* Add Story Modal */}
      <CreatePostModal
        isOpen={isAddStoryOpen}
        onClose={() => setIsAddStoryOpen(false)}
        currentUser={currentUser}
        onPostCreated={(data) => {
          store.createPost(data);
          syncState();
        }}
        onStoryCreated={(url, type) => {
          store.createStory(url, type);
          syncState();
        }}
      />

      {/* ML Recommendation Insights Modal */}
      {isMLModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="max-w-xl w-full rounded-3xl glass border border-purple-500/40 bg-[#120d24]/95 p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsMLModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-400 text-white shadow-lg shadow-purple-500/30">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-tight">
                  MediaGram ML Recommendation Engine
                </h3>
                <p className="text-xs text-white/60">
                  Real-time multi-factor ranking powered by Cloudinary AI Vision & semantic graph matching.
                </p>
              </div>
            </div>

            {/* Formula Card */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs text-amber-300 space-y-1.5">
              <p className="text-white/50 text-[10px] uppercase font-bold tracking-wider">Scoring Function</p>
              <p className="text-sm font-bold text-white">
                Score = w₁·Interest + w₂·Engagement + w₃·Recency + w₄·MediaFormat
              </p>
              <p className="text-[11px] text-white/60 font-sans">
                Where w₁ = 40%, w₂ = 30%, w₃ = 20%, w₄ = 10%
              </p>
            </div>

            {/* User Interest Vector */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Your Active Semantic Interest Vector</span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { tag: '#technology', match: '98%' },
                  { tag: '#tokyo', match: '94%' },
                  { tag: '#cinema', match: '91%' },
                  { tag: '#cyberpunk', match: '88%' },
                  { tag: '#travel', match: '82%' },
                  { tag: '#fitness', match: '84%' },
                ].map((item) => (
                  <span
                    key={item.tag}
                    className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-200 border border-purple-500/30 text-xs font-mono flex items-center gap-1.5"
                  >
                    <span>{item.tag}</span>
                    <strong className="text-amber-400">{item.match}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Cloudinary Integration note */}
            <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <span>Cloudinary AI Vision Feature Extraction</span>
              </p>
              <p className="text-white/70 text-[11px] leading-relaxed">
                When creators upload posts and vertical Reels, Cloudinary automatically runs deep learning auto-tagging, detects faces, extracts dominant color palettes, and encodes aspect ratios. These machine-extracted metadata tags directly feed into this recommendation model.
              </p>
            </div>

            <GlassButton
              variant="primary"
              onClick={() => setIsMLModalOpen(false)}
              className="w-full py-2.5 text-xs font-bold"
            >
              Close Algorithm Explorer
            </GlassButton>
          </div>
        </div>
      )}
    </AppShell>
  );
}
