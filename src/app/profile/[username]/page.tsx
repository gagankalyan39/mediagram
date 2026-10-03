'use client';

import React, { useState } from 'react';
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
  const [allUsers, setAllUsers] = useState<User[]>(store.getAllUsers());
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Find profile user by username
  const profileUser = store.getUserByUsername(username) || currentUser;

  const userPosts = store.getPosts().filter((p) => p.userId === profileUser.id);
  const userReels = store.getReels().filter((r) => r.userId === profileUser.id);
  const bookmarkedPosts = store.getPosts().filter((p) => p.isBookmarked);

  const handleSelectUser = (user: User) => {
    store.setCurrentUser(user.id);
    setCurrentUser({ ...user });
    setAllUsers([...store.getAllUsers()]);
  };

  const handleCreateAccount = (userData: {
    username: string;
    name: string;
    email: string;
    role: Role;
  }) => {
    store.createUser(userData);
    setCurrentUser({ ...store.getCurrentUser() });
    setAllUsers([...store.getAllUsers()]);
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
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onCreateAccount={handleCreateAccount}
      />
    </AppShell>
  );
}
