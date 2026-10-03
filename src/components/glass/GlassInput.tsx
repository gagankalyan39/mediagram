import React from 'react';
import { twMerge } from 'tailwind-merge';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  error?: string;
}

export function GlassInput({
  icon,
  label,
  error,
  className,
  ...props
}: GlassInputProps) {
  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-white/70 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-white/40 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          className={twMerge(
            'glass-input w-full px-4 py-2.5 text-sm placeholder:text-white/30',
            icon ? 'pl-10' : '',
            error ? 'border-rose-500/50 focus:border-rose-500' : '',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}
    </div>
  );
}
