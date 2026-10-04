'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { store } from '@/lib/store';
import {
  Sparkles,
  Shield,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Cloud,
  Film,
  Heart,
  MessageCircle,
  Play
} from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const loginId = customId || identifier;
    if (!loginId) {
      setError('Please enter your username or email');
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const res = store.login(loginId, password);
      if (res.success && res.user) {
        window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
        router.push('/');
      } else {
        setError(res.error || 'Login failed. Check your username and password.');
        setIsLoading(false);
      }
    }, 400);
  };

  const handleQuickLogin = (uname: string) => {
    setIdentifier(uname);
    setPassword('password123');
    handleLogin(undefined, uname);
  };

  const sampleAccounts = [
    { username: 'customer', name: 'Alex (Customer)' },
    { username: 'sophia_visuals', name: 'Sophia' },
    { username: 'marcus_lens', name: 'Marcus' },
    { username: 'elena_captures', name: 'Elena' },
    { username: 'kai_cinema', name: 'Kai' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 max-w-4xl w-full">
        {/* Left Column: Instagram Phone Showcase Mockup (Desktop) */}
        <div className="hidden md:flex flex-col items-center relative w-[340px] h-[640px] rounded-[44px] p-3 bg-black/60 border-[6px] border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden select-none">
          {/* Dynamic Island / Notch */}
          <div className="w-24 h-4 rounded-full bg-black mx-auto mb-2 shrink-0 border border-white/10" />

          {/* Phone Screen Mockup Content */}
          <div className="relative w-full flex-1 rounded-[32px] overflow-hidden bg-gradient-to-b from-[#10121a] to-black p-3.5 flex flex-col justify-between">
            {/* Mini Top Stories Bar */}
            <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
              <div className="story-ring-unseen p-[2px]">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                  alt="Customer"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <div className="story-ring-unseen p-[2px]">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                  alt="Sophia"
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <span className="text-[10px] text-white/50 ml-1">Live Stories</span>
            </div>

            {/* Mini Video Reel Card Mockup */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden my-auto border border-white/15 shadow-lg group">
              <img
                src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=600&h=800&fit=crop"
                alt="Tokyo"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-between p-3">
                <span className="self-end px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[9px] text-cyan-300 font-mono border border-cyan-500/30">
                  ⚡ 4K WebP
                </span>

                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-white">@customer</p>
                  <p className="text-[10px] text-white/80 line-clamp-1">
                    Tokyo Midnight 4K rain hyperlapse with Cloudinary adaptive delivery...
                  </p>
                  <div className="flex items-center gap-3 text-white text-[10px] pt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> 3.8K
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> 192
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Status */}
            <div className="flex items-center justify-between text-[10px] text-white/50 pt-2 border-t border-white/10">
              <span className="flex items-center gap-1">
                <Cloud className="w-3 h-3 text-cyan-400" />
                Cloudinary CDN
              </span>
              <span className="text-emerald-400 font-bold">100% Operational</span>
            </div>
          </div>
        </div>

        {/* Right Column: Instagram Login Card */}
        <div className="w-full max-w-sm space-y-4">
          <GlassCard className="p-7 border border-white/15 space-y-5 shadow-2xl">
            {/* Logo */}
            <div className="text-center space-y-1">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 shadow-xl shadow-purple-500/30 mb-2 p-0.5 border border-white/20 overflow-hidden hover:scale-105 transition-transform">
                <img
                  src="/logo.jpg"
                  alt="MediaGram Logo"
                  decoding="async"
                  className="w-full h-full object-cover rounded-[14px]"
                />
              </div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-white to-pink-300 bg-clip-text text-transparent">
                MediaGram
              </h1>
              <p className="text-xs text-white/60 font-medium">
                Scroll Into Something Amazing.
              </p>
            </div>

            {/* Quick 1-Click Login Chips */}
            <div className="space-y-1.5">
              <p className="text-[10px] text-white/50 text-center uppercase tracking-wider font-semibold">
                Quick 1-Click Login:
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {sampleAccounts.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickLogin(acc.username)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-400/20 text-white/80 hover:text-amber-300 border border-white/10 hover:border-amber-400/40 text-[11px] font-semibold transition-all cursor-pointer"
                  >
                    @{acc.username}
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                OR SIGN IN WITH USERNAME
              </span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-3">
              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <GlassInput
                placeholder="Username or email (e.g. customer, sophia_visuals)"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />

              <div className="relative">
                <GlassInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <GlassButton
                type="submit"
                variant="primary"
                className="w-full py-2.5 text-xs font-bold mt-2"
                isLoading={isLoading}
              >
                Log In to Account
              </GlassButton>
            </form>
          </GlassCard>

          {/* Secondary Info Card */}
          <GlassCard className="p-3.5 border border-white/10 text-center text-xs text-white/60">
            <span className="font-bold text-white tracking-wide">MediaGram</span>
            <span className="block text-[11px] text-white/40 mt-0.5">
              1,000+ real active accounts ready to browse, follow & message.
            </span>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
