'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Story } from '@/lib/types';
import { X, ChevronLeft, ChevronRight, Heart, Send, Sparkles, Check } from 'lucide-react';
import { GlassAvatar } from '../glass/GlassAvatar';
import { store } from '@/lib/store';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onStorySeen: (storyId: string) => void;
}

export function StoryViewerModal({
  stories,
  initialIndex,
  isOpen,
  onClose,
  onStorySeen,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sentToast, setSentToast] = useState(false);
  const [likedHeart, setLikedHeart] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStory = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen || !activeStory) return;

    onStorySeen(activeStory.id);
    setProgress(0);

    const duration = (activeStory.durationSeconds || 6) * 1000;
    const intervalMs = 100;
    const step = (intervalMs / duration) * 100;

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 0;
          }
          return prev + step;
        });
      }
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isPaused, activeStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim() || !activeStory) return;
    store.sendDirectMessage({
      recipientId: activeStory.userId,
      text: `Replied to your story: "${replyText.trim()}"`,
    });
    setReplyText('');
    setSentToast(true);
    setTimeout(() => setSentToast(false), 2000);
  };

  const handleLikeStory = () => {
    setLikedHeart(true);
    store.sendDirectMessage({
      recipientId: activeStory.userId,
      text: '❤️ Reacted to your story',
    });
    setTimeout(() => setLikedHeart(false), 1500);
  };

  if (!isOpen || !activeStory) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Top Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 cursor-pointer transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 hidden md:block cursor-pointer transition-all hover:scale-110"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white z-50 hidden md:block cursor-pointer transition-all hover:scale-110"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story Box Container with Smooth Slide & Scale Transitions */}
      <div
        className="relative w-full max-w-md h-[88vh] rounded-3xl overflow-hidden glass border border-white/20 shadow-2xl flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Top Progress Bars */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5">
          {stories.map((story, idx) => (
            <div
              key={story.id}
              className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{
                  width:
                    idx === currentIndex
                      ? `${progress}%`
                      : idx < currentIndex
                      ? '100%'
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Author Header */}
        <div className="absolute top-7 inset-x-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <GlassAvatar
              src={activeStory.user.avatarUrl}
              name={activeStory.user.name}
              size="xs"
              isVerified={activeStory.user.isVerified}
            />
            <span className="text-xs font-bold text-white shadow-sm">
              @{activeStory.user.username}
            </span>
            <span className="text-[10px] text-white/60">Story</span>
          </div>
        </div>

        {/* Story Media (Image or Video) with Animated Transition Key */}
        <div
          key={activeStory.id}
          className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        >
          {activeStory.resourceType === 'video' ? (
            <video
              src={activeStory.mediaUrl}
              autoPlay
              muted
              playsInline
              loop
              className="w-full h-full object-cover transition-transform duration-500 ease-out"
            />
          ) : (
            <img
              src={activeStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover transition-transform duration-500 ease-out"
            />
          )}

          {/* Big Heart animation on reaction */}
          {likedHeart && (
            <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none animate-in zoom-in-50 duration-200">
              <Heart className="w-24 h-24 text-rose-500 fill-rose-500 drop-shadow-2xl animate-pulse" />
            </div>
          )}

          {/* Left / Right click zones for mobile/desktop taps */}
          <div
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
          />
          <div
            className="absolute right-0 inset-y-0 w-2/3 z-20 cursor-pointer"
            onClick={handleNext}
          />
        </div>

        {/* Bottom Reaction / Reply Bar */}
        <div className="absolute bottom-4 inset-x-4 z-30 flex items-center gap-2.5">
          <form onSubmit={handleSendReply} className="flex-1 relative">
            <input
              type="text"
              placeholder={sentToast ? 'Message sent! ✓' : `Reply to @${activeStory.user.username}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder:text-white/50 focus:outline-none focus:border-amber-400/80 transition-colors"
            />
          </form>

          <button
            type="button"
            onClick={handleLikeStory}
            className={`p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white transition-all cursor-pointer ${
              likedHeart ? 'text-rose-500 scale-125' : 'hover:text-rose-400'
            }`}
            title="Like Story"
          >
            <Heart className={`w-5 h-5 ${likedHeart ? 'fill-rose-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleSendReply()}
            disabled={!replyText.trim()}
            className={`p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 transition-all cursor-pointer ${
              replyText.trim()
                ? 'text-amber-400 border-amber-400/50 hover:bg-amber-400/20'
                : 'text-white/40 cursor-not-allowed'
            }`}
            title="Send Direct Message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
