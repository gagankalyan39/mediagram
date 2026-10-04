'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Search,
  Compass,
  Film,
  MessageSquare,
  Heart,
  PlusSquare,
  FolderLock,
  LogOut,
  Settings,
  Sparkles,
  Cloud
} from 'lucide-react';
import { GlassAvatar } from '../glass/GlassAvatar';
import { User } from '@/lib/types';
import { store } from '@/lib/store';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  currentUser: User;
  onOpenCreateModal: () => void;
  onOpenSearchModal: () => void;
}

export function Sidebar({
  currentUser,
  onOpenCreateModal,
  onOpenSearchModal,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [unreadNotifsCount, setUnreadNotifsCount] = React.useState<number>(0);
  const [isMounted, setIsMounted] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsMounted(true);
    const updateCounts = () => {
      if (typeof store.getTotalUnreadMessagesCount === 'function') {
        setUnreadCount(store.getTotalUnreadMessagesCount());
      }
      if (typeof store.getUnreadNotificationsCount === 'function') {
        setUnreadNotifsCount(store.getUnreadNotificationsCount());
      }
    };
    updateCounts();
    window.addEventListener('beesocial:store_updated', updateCounts);
    return () => window.removeEventListener('beesocial:store_updated', updateCounts);
  }, []);

  const handleLogout = () => {
    store.logout();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    router.push('/login');
  };

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Search', action: onOpenSearchModal, icon: Search, isAction: true },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Reels', href: '/reels', icon: Film, highlight: true },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      badge: isMounted && unreadCount > 0 ? String(unreadCount) : undefined,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Heart,
      badge: isMounted && unreadNotifsCount > 0 ? String(unreadNotifsCount) : undefined,
    },
    { label: 'Cloudinary API', href: '/library', icon: Cloud, highlight: true },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-white/10 z-40 hidden md:flex flex-col justify-between p-4 bg-[#0a0c14]/90">
      {/* Top Brand Logo & Tagline */}
      <div className="space-y-6">
        <Link href="/" className="flex items-center gap-3 px-3 py-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform overflow-hidden">
            <img src="/logo.jpg" alt="MediaGram Logo" decoding="async" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-200 via-white to-pink-300 bg-clip-text text-transparent">
              MediaGram
            </span>
            <div className="flex items-center gap-1 text-[9px] text-white/50 tracking-wider font-medium">
              <Sparkles className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span className="truncate">Scroll Into Something Amazing</span>
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white hover:bg-white/[0.06] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-white/60 group-hover:text-amber-400 transition-transform group-hover:scale-110" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-amber-400/80 font-mono bg-amber-400/10 px-1.5 py-0.5 rounded">
                    1K+
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href!}
                className={twMerge(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                  isActive
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={twMerge(
                      'w-4 h-4 transition-transform group-hover:scale-110',
                      isActive ? 'text-amber-400' : 'text-white/60 group-hover:text-white'
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
                {item.highlight && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-bold tracking-wider">
                    Hot
                  </span>
                )}
              </Link>
            );
          })}

          {/* Create Post Button */}
          <button
            onClick={onOpenCreateModal}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/90 hover:text-white hover:bg-white/[0.06] transition-all group cursor-pointer"
          >
            <PlusSquare className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Create</span>
          </button>

          {/* Profile Link */}
          <Link
            href={`/profile/${currentUser.username}`}
            className={twMerge(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all',
              pathname === `/profile/${currentUser.username}`
                ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/[0.06]'
            )}
          >
            <GlassAvatar
              src={currentUser.avatarUrl}
              name={currentUser.name}
              size="xs"
              isVerified={currentUser.isVerified}
            />
            <span>Profile</span>
          </Link>
        </nav>
      </div>

      {/* Bottom User Area & Logout */}
      <div className="pt-3 border-t border-white/10 space-y-2.5">
        <Link
          href={`/profile/${currentUser.username}`}
          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] transition-all border border-white/10 group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <GlassAvatar
              src={currentUser.avatarUrl}
              name={currentUser.name}
              size="sm"
              isVerified={currentUser.isVerified}
            />
            <div className="overflow-hidden">
              <p suppressHydrationWarning className="text-xs font-bold text-white truncate">
                {currentUser.name}
              </p>
              <p suppressHydrationWarning className="text-[10px] text-white/50 truncate">@{currentUser.username}</p>
            </div>
          </div>
        </Link>

        {/* Dedicated Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-500/25"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
