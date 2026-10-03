'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { store } from '@/lib/store';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Terminal,
  Zap,
  HardDrive,
  Cloud,
  CheckCircle2,
  KeyRound
} from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [adminKey, setAdminKey] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = (e?: React.FormEvent, isFastAuth = false) => {
    if (e) e.preventDefault();

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      // Fast auth or key check
      const res = store.loginAdmin(adminKey);
      if (res.success) {
        window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
        router.push('/admin');
      } else {
        setError(res.error || 'Access Denied: Invalid Master Admin credentials.');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#05030a] relative overflow-hidden select-none">
      {/* Background ambient security grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#7c3aed_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-md w-full space-y-5">
        {/* Terminal Header Card */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-amber-400 shadow-xl shadow-purple-900/40 border border-purple-500/40 mb-1">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            MediaGram Admin Gateway
          </h1>
          <p className="text-xs text-purple-300/70 font-mono">
            SECURE ACCESS PORTAL // AUTHORIZED ROOT PERSONNEL ONLY
          </p>
        </div>

        {/* Admin Login Card */}
        <GlassCard className="p-6 md:p-8 border border-purple-500/30 bg-[#0f0a1c]/90 space-y-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
            <span className="flex items-center gap-1.5 text-purple-300 font-mono font-bold">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              PORTAL: ROOT-AUTH-v2
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              SYSTEM ACTIVE
            </span>
          </div>

          {/* 1-Click Fast Master Root Auth */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleAdminLogin(undefined, true)}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-lg shadow-purple-900/50 hover:scale-[1.02] active:scale-[0.98] border border-purple-400/40"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Authorize Master Root Session (@admin)</span>
            </button>
            <p className="text-[10px] text-white/40 text-center font-mono">
              Instant clearance to platform analytics, user suspension & Cloudinary engine
            </p>
          </div>

          {/* Security Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-mono text-purple-300/60 uppercase tracking-widest">
              OR ENTER CREDENTIALS
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="space-y-3.5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] text-white/60 font-mono block">Security ID / Email</label>
              <GlassInput
                icon={<KeyRound className="w-4 h-4 text-purple-400" />}
                placeholder="admin or admin@mediagram.app"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-white/60 font-mono block">Master Password / Passkey</label>
              <div className="relative">
                <GlassInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Master authorization key"
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
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              className="w-full py-2.5 text-xs font-bold mt-2 shadow-lg shadow-purple-900/40 bg-purple-600 hover:bg-purple-500"
              isLoading={isLoading}
            >
              Sign In to Admin Operations Center
            </GlassButton>
          </form>

          {/* Environment Status Badge */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-white/60 text-[11px]">
              <span>Cloudinary Product Env:</span>
              <strong className="text-cyan-300">rwcuzbxd</strong>
            </div>
            <div className="flex justify-between text-white/60 text-[11px]">
              <span>Status:</span>
              <span className="text-emerald-400 font-bold">100% Operational</span>
            </div>
          </div>
        </GlassCard>

        {/* Back to Public Web Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white transition-colors font-mono hover:underline"
          >
            ← Return to MediaGram Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
