'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassAvatar } from '@/components/glass/GlassAvatar';
import { Heart, MessageCircle, UserPlus, Sparkles, CheckCheck } from 'lucide-react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { NotificationItem, User } from '@/lib/types';

export default function NotificationsPage() {
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    store.getNotifications(store.getCurrentUser().id)
  );

  useEffect(() => {
    const cur = store.getCurrentUser();
    setCurrentUser(cur);
    setNotifications(store.getNotifications(cur.id));
    // Auto-mark notifications as read when visiting page
    store.markNotificationsAsRead(cur.id);

    const handleUpdate = () => {
      setNotifications(store.getNotifications(store.getCurrentUser().id));
    };
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, []);

  const handleMarkAllRead = () => {
    store.markNotificationsAsRead(currentUser.id);
    setNotifications(store.getNotifications(currentUser.id));
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4 pb-16">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>

        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-white/50 glass-card border border-white/10 rounded-2xl">
              <Heart className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No notifications yet</p>
              <p className="text-xs text-white/40 mt-1">When someone likes your posts or reels, you'll see it here.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <GlassCard
                key={n.id}
                className={`p-3.5 flex items-center justify-between gap-4 transition-all ${
                  !n.isRead ? 'border-amber-400/40 bg-amber-400/5' : 'hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="relative">
                    <GlassAvatar
                      src={n.fromUser.avatarUrl}
                      name={n.fromUser.name}
                      size="sm"
                    />
                    <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-black">
                      {n.type === 'like' && (
                        <div className="p-1 rounded-full bg-rose-500 text-white">
                          <Heart className="w-2.5 h-2.5 fill-white" />
                        </div>
                      )}
                      {n.type === 'comment' && (
                        <div className="p-1 rounded-full bg-cyan-500 text-white">
                          <MessageCircle className="w-2.5 h-2.5 fill-white" />
                        </div>
                      )}
                      {n.type === 'follow' && (
                        <div className="p-1 rounded-full bg-purple-500 text-white">
                          <Sparkles className="w-2.5 h-2.5 fill-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs leading-relaxed overflow-hidden">
                    <Link href={`/profile/${n.fromUser.username}`} className="font-bold text-white hover:text-amber-400 mr-1">
                      @{n.fromUser.username}
                    </Link>
                    <span className="text-white/80">{n.message}</span>
                    <span className="text-[10px] text-white/40 block mt-0.5">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {n.postPreviewUrl ? (
                  n.postPreviewUrl.includes('.mp4') || n.postPreviewUrl.includes('#t=') ? (
                    <video
                      src={n.postPreviewUrl}
                      preload="metadata"
                      muted
                      playsInline
                      className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0 pointer-events-none"
                    />
                  ) : (
                    <img
                      src={n.postPreviewUrl}
                      alt="Post preview"
                      className="w-11 h-11 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                  )
                ) : (
                  <Link
                    href={`/profile/${n.fromUser.username}`}
                    className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0"
                  >
                    View
                  </Link>
                )}
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
