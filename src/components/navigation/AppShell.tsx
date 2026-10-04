'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { CreatePostModal } from '../upload/CreatePostModal';
import { StoryViewerModal } from '../feed/StoryViewerModal';
import { SearchModal } from '../search/SearchModal';
import { store } from '@/lib/store';
import { User, Story, MediaAsset } from '@/lib/types';
import Link from 'next/link';
import { GlassAvatar } from '../glass/GlassAvatar';
import {
  Home,
  Search,
  Compass,
  Film,
  MessageSquare,
  PlusSquare,
  FolderLock,
  LogOut,
  UserX,
  Cloud
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [stories, setStories] = useState<Story[]>(store.getStories());
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const pathname = usePathname();

  // Route protection & storage hydration
  useEffect(() => {
    store.loadFromStorage();
    if (!store.isLoggedIn() && pathname !== '/login') {
      router.push('/login');
    }
    if (typeof store.getTotalUnreadMessagesCount === 'function') {
      setUnreadCount(store.getTotalUnreadMessagesCount());
    }
    refreshState();
  }, [pathname, router]);

  // Listen to store updates
  const refreshState = () => {
    setCurrentUser({ ...store.getCurrentUser() });
    setStories([...store.getStories()]);
    if (typeof store.getTotalUnreadMessagesCount === 'function') {
      setUnreadCount(store.getTotalUnreadMessagesCount());
    }
  };

  const handlePostCreated = (data: {
    caption: string;
    location?: string;
    media: MediaAsset[];
    tags: string[];
    isReel: boolean;
    audioTrackTitle?: string;
  }) => {
    store.createPost(data);
    refreshState();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handleStoryCreated = (mediaUrl: string, resourceType: 'image' | 'video') => {
    store.createStory(mediaUrl, resourceType);
    refreshState();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handleStorySeen = (storyId: string) => {
    store.markStorySeen(storyId);
    setStories([...store.getStories()]);
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentUser={currentUser}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Mobile Bar */}
        <header className="md:hidden glass sticky top-0 z-30 px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Logo" decoding="async" className="w-6 h-6 rounded-md object-cover" />
            <span className="font-black text-lg bg-gradient-to-r from-amber-200 to-pink-400 bg-clip-text text-transparent">
              MediaGram
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/library"
              className="p-1.5 rounded-full bg-white/10 text-cyan-400 hover:bg-white/15"
              title="Cloudinary API"
            >
              <Cloud className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-1.5 rounded-full bg-white/10 text-amber-400 hover:bg-white/15"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <Link
              href={`/profile/${currentUser.username}`}
              className="p-1 rounded-full bg-white/10 text-white flex items-center gap-1.5 px-2 text-xs hover:bg-white/15"
            >
              <span suppressHydrationWarning>@{currentUser.username}</span>
            </Link>
            <Link href={`/profile/${currentUser.username}`}>
              <GlassAvatar
                src={currentUser.avatarUrl}
                name={currentUser.name}
                size="xs"
              />
            </Link>
            <button
              onClick={() => {
                store.logout();
                window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
                router.push('/login');
              }}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Children */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-28 md:pb-8">
          {/* Suspended User Warning Banner */}
          {currentUser.status === 'suspended' && (
            <div className="mb-6 p-4 rounded-2xl glass border border-rose-500/50 bg-rose-950/40 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-shake">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Your Account is Currently Suspended</p>
                  <p className="text-xs text-rose-200/80">
                    The Master Administrator has suspended @{currentUser.username}. You cannot create posts or upload media until reinstated by the Master Admin.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-white/50 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
                Contact: support@mediagram.app
              </span>
            </div>
          )}
          {children}
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden glass fixed bottom-0 inset-x-0 z-40 border-t border-white/10 px-2 py-2 pb-safe flex items-center justify-around touch-manipulation select-none backdrop-blur-xl bg-[#0b0d14]/95">
          <Link
            href="/"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl active:scale-95 transition-all touch-manipulation ${
              pathname === '/' ? 'text-amber-400' : 'text-white/60'
            }`}
          >
            <Home className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-white/60 hover:text-amber-400 active:scale-95 transition-all touch-manipulation cursor-pointer"
            title="Search Accounts"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 rounded-xl bg-gradient-to-tr from-amber-400 to-pink-500 text-black shadow-lg shadow-amber-400/20 active:scale-95 transition-all touch-manipulation cursor-pointer"
          >
            <PlusSquare className="w-5 h-5" />
          </button>
          <Link
            href="/reels"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl active:scale-95 transition-all touch-manipulation ${
              pathname === '/reels' ? 'text-purple-400' : 'text-white/60'
            }`}
          >
            <Film className="w-5 h-5" />
          </Link>
          <Link
            href="/messages"
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 relative rounded-xl active:scale-95 transition-all touch-manipulation ${
              pathname === '/messages' ? 'text-amber-400' : 'text-white/60'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 shadow-md shadow-amber-400/50" />
            )}
          </Link>
          <Link
            href={`/profile/${currentUser.username}`}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl active:scale-95 transition-all touch-manipulation ${
              pathname.startsWith('/profile') ? 'text-amber-400' : 'text-white/60'
            }`}
          >
            <GlassAvatar
              src={currentUser.avatarUrl}
              name={currentUser.name}
              size="xs"
            />
          </Link>
        </nav>
      </main>

      {/* Global Search Accounts Modal (1,000+ Accounts) */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      {/* Cloudinary Post / Reel / Story Upload Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        onPostCreated={handlePostCreated}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={activeStoryIndex}
          isOpen={activeStoryIndex !== null}
          onClose={() => setActiveStoryIndex(null)}
          onStorySeen={handleStorySeen}
        />
      )}
    </div>
  );
}
