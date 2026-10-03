import React from 'react';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

interface GlassAvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  hasStory?: boolean;
  isStorySeen?: boolean;
  isVerified?: boolean;
  className?: string;
  onClick?: () => void;
}

export function GlassAvatar({
  src,
  name = 'User',
  size = 'md',
  hasStory = false,
  isStorySeen = false,
  isVerified = false,
  className,
  onClick,
}: GlassAvatarProps) {
  const sizeMap = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const ringPadding = {
    xs: 'p-[1.5px]',
    sm: 'p-[2px]',
    md: 'p-[2.5px]',
    lg: 'p-[3px]',
    xl: 'p-[4px]',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const avatarContent = (
    <div
      className={twMerge(
        'relative rounded-full overflow-hidden bg-white/10 flex items-center justify-center font-semibold text-white/90 border border-white/20 select-none aspect-square',
        sizeMap[size]
      )}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  return (
    <div className="relative inline-block" onClick={onClick}>
      {hasStory ? (
        <div
          className={twMerge(
            'rounded-full cursor-pointer transition-transform active:scale-95',
            ringPadding[size],
            isStorySeen ? 'story-ring-seen' : 'story-ring-unseen',
            className
          )}
        >
          <div className="bg-[#06070c] rounded-full p-[2px]">{avatarContent}</div>
        </div>
      ) : (
        <div className={twMerge('inline-block cursor-pointer', className)}>{avatarContent}</div>
      )}

      {isVerified && (
        <div
          className={twMerge(
            'absolute bottom-0 right-0 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-[#06070c] shadow-sm',
            size === 'xl' ? 'w-6 h-6' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
          )}
          title="Verified Creator"
        >
          <Check className="w-2.5 h-2.5 stroke-[3]" />
        </div>
      )}
    </div>
  );
}
