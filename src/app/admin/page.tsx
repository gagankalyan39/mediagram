'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { store } from '@/lib/store';
import { User, Role } from '@/lib/types';
import { ShieldAlert, ShieldCheck, Lock, Loader2 } from 'lucide-react';

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as 'topics' | 'users' | 'media' | 'moderation' | 'pipeline' | null;

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [stats, setStats] = useState(() => store.getAdminStats());
  const [users, setUsers] = useState<User[]>(() => store.getAllUsers());
  const [posts, setPosts] = useState(() => store.getRawPosts());
  const [mediaAssets, setMediaAssets] = useState(() => store.getAllMediaAssets());

  const refreshAdmin = () => {
    setStats(store.getAdminStats());
    setUsers([...store.getAllUsers()]);
    setPosts(store.getRawPosts());
    setMediaAssets(store.getAllMediaAssets());
  };

  useEffect(() => {
    // Check master admin authentication
    const hasAdminAccess = store.isAdminLoggedIn();
    if (!hasAdminAccess) {
      router.replace('/admin/login');
      return;
    }

    setIsAdminAuthenticated(true);
    setIsCheckingAuth(false);
    refreshAdmin();

    const handleUpdate = () => refreshAdmin();
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, [router]);

  const handleSuspendUser = (userId: string) => {
    store.suspendUser(userId);
    refreshAdmin();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handleUnsuspendUser = (userId: string) => {
    store.unsuspendUser(userId);
    refreshAdmin();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handleDeletePost = (postId: string) => {
    store.deletePostAdmin(postId);
    refreshAdmin();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handleUpdateRole = (userId: string, role: Role) => {
    store.updateUserRole(userId, role);
    refreshAdmin();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handleDeleteMedia = (mediaId: string) => {
    store.deleteMediaAsset(mediaId);
    refreshAdmin();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  if (isCheckingAuth || !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#07050f] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center animate-pulse shadow-lg shadow-purple-500/20">
          <ShieldCheck className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-xs font-mono text-purple-300/80">Verifying Master Admin clearance...</p>
      </div>
    );
  }

  return (
    <AdminShell>
      <AdminDashboard
        stats={stats}
        users={users}
        posts={posts}
        mediaAssets={mediaAssets}
        onDeletePost={handleDeletePost}
        onUpdateRole={handleUpdateRole}
        onDeleteMedia={handleDeleteMedia}
        onSuspendUser={handleSuspendUser}
        onUnsuspendUser={handleUnsuspendUser}
        initialTab={tabParam || 'topics'}
      />
    </AdminShell>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07050f] flex items-center justify-center text-xs font-mono text-purple-300/60">
          Loading MediaGram Admin Console...
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
