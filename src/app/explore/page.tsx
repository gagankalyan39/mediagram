'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { ExploreGrid } from '@/components/explore/ExploreGrid';
import { PostCard } from '@/components/feed/PostCard';
import { GlassModal } from '@/components/glass/GlassModal';
import { store } from '@/lib/store';
import { Post, User } from '@/lib/types';

export default function ExplorePage() {
  const [posts, setPosts] = useState<Post[]>(store.getPosts());
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const currentUser: User = store.getCurrentUser();

  React.useEffect(() => {
    if (typeof store.getRandomizedPosts === 'function') {
      setPosts(store.getRandomizedPosts(currentUser.id));
    }
  }, [currentUser.id]);

  const handleToggleLike = (postId: string) => {
    const res = store.toggleLikePost(postId);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isLiked: res.isLiked, likesCount: res.likesCount } : p))
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, isLiked: res.isLiked, likesCount: res.likesCount });
    }
  };

  const handleToggleBookmark = (postId: string) => {
    const isBookmarked = store.toggleBookmarkPost(postId);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isBookmarked } : p))
    );
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({ ...selectedPost, isBookmarked });
    }
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

  return (
    <AppShell>
      <ExploreGrid posts={posts} onSelectPost={(p) => setSelectedPost(p)} />

      {/* Selected Post Modal */}
      {selectedPost && (
        <GlassModal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title={`Post by @${selectedPost.user.username}`}
          maxWidth="md"
        >
          <PostCard
            post={selectedPost}
            currentUser={currentUser}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            onAddComment={handleAddComment}
          />
        </GlassModal>
      )}
    </AppShell>
  );
}
