'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { ReelsFeed } from '@/components/reels/ReelsFeed';
import { store } from '@/lib/store';
import { Reel, User } from '@/lib/types';

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>(store.getReels());
  const currentUser: User = store.getCurrentUser();

  useEffect(() => {
    if (typeof store.getRandomizedReels === 'function') {
      setReels(store.getRandomizedReels(currentUser.id));
    }
  }, [currentUser.id]);

  const handleShuffle = () => {
    if (typeof store.getRandomizedReels === 'function') {
      setReels(store.getRandomizedReels(currentUser.id));
    }
  };

  const handleToggleLike = (reelId: string) => {
    const res = store.toggleLikeReel(reelId);
    setReels(prev =>
      prev.map(r => (r.id === reelId ? { ...r, isLiked: res.isLiked, likesCount: res.likesCount } : r))
    );
  };

  const handleToggleBookmark = (postId: string) => {
    const isBookmarked = store.toggleBookmarkPost(postId);
    setReels(prev =>
      prev.map(r => (r.postId === postId ? { ...r, isBookmarked } : r))
    );
  };

  return (
    <AppShell>
      <div className="w-full flex justify-center">
        <ReelsFeed
          reels={reels}
          currentUser={currentUser}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onShuffle={handleShuffle}
        />
      </div>
    </AppShell>
  );
}
