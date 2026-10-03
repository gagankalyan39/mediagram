'use client';

import React from 'react';
import { Story, User } from '@/lib/types';
import { GlassAvatar } from '../glass/GlassAvatar';
import { Plus } from 'lucide-react';

interface StoriesBarProps {
  stories: Story[];
  currentUser: User;
  onSelectStory: (index: number) => void;
  onAddStory: () => void;
}

export function StoriesBar({
  stories,
  currentUser,
  onSelectStory,
  onAddStory,
}: StoriesBarProps) {
  return (
    <div className="w-full glass-card p-4 overflow-x-auto flex items-center gap-4 scrollbar-none">
      {/* Current User Story / Add Story button */}
      <div
        onClick={onAddStory}
        className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group select-none"
      >
        <div className="relative">
          <GlassAvatar
            src={currentUser.avatarUrl}
            name={currentUser.name}
            size="md"
          />
          <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-black flex items-center justify-center border-2 border-[#06070c] shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-3 h-3 stroke-[3]" />
          </div>
        </div>
        <span className="text-[11px] font-medium text-white/70 max-w-[64px] truncate">
          Your story
        </span>
      </div>

      {/* Friends Stories */}
      {stories.map((story, index) => (
        <div
          key={story.id}
          onClick={() => onSelectStory(index)}
          className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 select-none group"
        >
          <GlassAvatar
            src={story.user.avatarUrl}
            name={story.user.name}
            size="md"
            hasStory={true}
            isStorySeen={story.isSeen}
            isVerified={story.user.isVerified}
          />
          <span className="text-[11px] font-medium text-white/80 max-w-[64px] truncate group-hover:text-white transition-colors">
            {story.user.username}
          </span>
        </div>
      ))}
    </div>
  );
}
