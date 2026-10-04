'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/navigation/AppShell';
import { ProfileView } from '@/components/profile/ProfileView';
import { AccountSwitcherModal } from '@/components/navigation/AccountSwitcherModal';
import { store } from '@/lib/store';
import { User, Role } from '@/lib/types';

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;

  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    store.loadFromStorage();
    setStoreVersion((v) => v + 1);

    const handleUpdate = () => {
      setStoreVersion((v) => v + 1);
      setCurrentUser({ ...store.getCurrentUser() });
    };
    window.addEventListener('beesocial:store_updated', handleUpdate);
    return () => window.removeEventListener('beesocial:store_updated', handleUpdate);
  }, []);

  // Find profile user by username
  const profileUser = useMemo(
    () => store.getUserByUsername(username) || currentUser,
    [username, currentUser, storeVersion]
  );

  const userPosts = useMemo(
    () =>
      store
        .getRawPosts()
        .filter(
          (p) =>
            p.userId === profileUser.id ||
            p.user?.username?.toLowerCase() === profileUser.username?.toLowerCase()
        ),
    [profileUser.id, profileUser.username, storeVersion]
  );

  const userReels = useMemo(
    () =>
      store
        .getReels()
        .filter(
          (r) =>
            r.userId === profileUser.id ||
            r.user?.username?.toLowerCase() === profileUser.username?.toLowerCase()
        ),
    [profileUser.id, profileUser.username, storeVersion]
  );

  const bookmarkedPosts = useMemo(
    () => store.getRawPosts().filter((p) => p.isBookmarked),
    [storeVersion]
  );

  const switcherUsers = useMemo(
    () => [
      store.getUserById('usr_customer') || currentUser,
      store.getUserById('usr_admin') || currentUser,
    ],
    [currentUser, storeVersion]
  );

  const handleSelectUser = (user: User) => {
    store.setCurrentUser(user.id);
    setCurrentUser({ ...user });
  };

  const handleCreateAccount = (userData: {
    username: string;
    name: string;
    email: string;
    role: Role;
  }) => {
    store.createUser(userData);
    setCurrentUser({ ...store.getCurrentUser() });
  };

  const handleToggleLike = (postId: string) => {
    store.toggleLikePost(postId);
  };

  return (
    <AppShell>
      <ProfileView
        user={profileUser}
        currentUser={currentUser}
        userPosts={userPosts}
        userReels={userReels}
        bookmarkedPosts={bookmarkedPosts}
        onOpenAccountSwitcher={() => setIsSwitcherOpen(true)}
        onToggleLike={handleToggleLike}
      />

      <AccountSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        currentUser={currentUser}
        allUsers={switcherUsers}
        onSelectUser={handleSelectUser}
        onCreateAccount={handleCreateAccount}
      />
    </AppShell>
  );
}
