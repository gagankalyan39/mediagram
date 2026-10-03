import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: 'purple' | 'cyan' | 'pink' | 'none';
  variant?: 'default' | 'subtle' | 'interactive';
}

export function GlassCard({
  children,
  className,
  glow = 'none',
  variant = 'default',
  ...props
}: GlassCardProps) {
  const glowStyles = {
    purple: 'hover:border-purple-500/30 hover:shadow-[0_0_35px_rgba(139,92,246,0.15)]',
    cyan: 'hover:border-cyan-500/30 hover:shadow-[0_0_35px_rgba(6,182,212,0.15)]',
    pink: 'hover:border-pink-500/30 hover:shadow-[0_0_35px_rgba(236,72,153,0.15)]',
    none: '',
  };

  const variantStyles = {
    default: 'glass-card',
    subtle: 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl',
    interactive: 'glass-interactive rounded-2xl cursor-pointer',
  };

  return (
    <div
      className={twMerge(
        variantStyles[variant],
        glowStyles[glow],
        'p-5 transition-all duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
