'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { ReelsFeed } from '@/components/reels/ReelsFeed';
import { store } from '@/lib/store';
import { Reel, User } from '@/lib/types';

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const currentUser: User = store.getCurrentUser();
  const watchedReelsRef = useRef<Set<string>>(new Set());
  const isLoadingMoreRef = useRef(false);

  useEffect(() => {
    store.loadFromStorage();
    const initial = store.getRandomizedReels();
    if (initial[0]) {
      watchedReelsRef.current.add(initial[0].id.split('_rpt_')[0]);
    }
    setReels([...initial]);

    const handleUpdate = () => {
      store.loadFromStorage();
      const updated = store.getRandomizedReels();
      setReels([...updated]);
    };
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, []);

  const handleShuffle = () => {
    const currentId = reels[0]?.id;
    watchedReelsRef.current.clear();
    const shuffled = store.getRandomizedReels(currentId);
    if (shuffled[0]) {
      watchedReelsRef.current.add(shuffled[0].id.split('_rpt_')[0]);
    }
    setReels([...shuffled]);
  };

  const handleReelViewed = (reelId: string) => {
    const canonicalId = reelId.split('_rpt_')[0];
    watchedReelsRef.current.add(canonicalId);
  };

  // Endless Infinite Reels: Never ends, repeats watched occasionally, and repeats all once completed
  const handleLoadMore = () => {
    if (isLoadingMoreRef.current) return;
    isLoadingMoreRef.current = true;

    const { nextBatch, updatedWatched } = store.getNextInfiniteReelsBatch(watchedReelsRef.current, 8);
    watchedReelsRef.current = updatedWatched;
    setReels((prev) => [...prev, ...nextBatch]);

    setTimeout(() => {
      isLoadingMoreRef.current = false;
    }, 350);
  };

  const handleToggleLike = (reelId: string) => {
    const canonicalId = reelId.split('_rpt_')[0];
    const res = store.toggleLikeReel(canonicalId);
    setReels((prev) =>
      prev.map((r) => {
        const cId = r.id.split('_rpt_')[0];
        if (cId === canonicalId) {
          return { ...r, isLiked: res.isLiked, likesCount: res.likesCount };
        }
        return r;
      })
    );
  };

  const handleToggleBookmark = (postId: string) => {
    const isBookmarked = store.toggleBookmarkPost(postId);
    setReels((prev) =>
      prev.map((r) => (r.postId === postId ? { ...r, isBookmarked } : r))
    );
  };

  return (
    <AppShell>
      <div className="w-full flex justify-center">
        {reels.length > 0 ? (
          <ReelsFeed
            key={reels[0]?.id || 'reels-feed'}
            reels={reels}
            currentUser={currentUser}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            onShuffle={handleShuffle}
            onLoadMore={handleLoadMore}
            onReelViewed={handleReelViewed}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-white/50">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Curating randomized reels...</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
