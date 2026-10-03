'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  BarChart3,
  UserX,
  ShieldAlert,
  Layers,
  FolderLock,
  LogOut,
  ExternalLink,
  HardDrive,
  Cloud,
  Sparkles
} from 'lucide-react';
import { store } from '@/lib/store';
import { twMerge } from 'tailwind-merge';

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleAdminLogout = () => {
    store.logoutAdmin();
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Command Center', href: '/admin', icon: ShieldCheck, badge: 'Active' },
    { label: 'All-Topics Analytics', href: '/admin?tab=topics', icon: BarChart3, highlight: true },
    { label: 'User Governance', href: '/admin?tab=users', icon: UserX },
    { label: 'Moderation Queue', href: '/admin?tab=moderation', icon: ShieldAlert, badge: '1 Flag' },
    { label: 'Cloudinary Pipeline', href: '/admin?tab=pipeline', icon: Layers },
    { label: 'Media Assets Hub', href: '/admin?tab=media', icon: FolderLock },
  ];

  return (
    <div className="flex min-h-screen bg-[#07050f] text-white">
      {/* Desktop Left Admin Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-purple-500/20 bg-[#0d091a]/95 z-40 hidden md:flex flex-col justify-between p-4 shadow-2xl">
        <div className="space-y-6">
          {/* Admin Header */}
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white block">
                MediaGram
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-purple-300 uppercase tracking-widest font-mono font-bold">
                <span>ROOT ADMIN</span>
              </div>
            </div>
          </Link>

          {/* Root Status Pill */}
          <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-between text-xs text-purple-200 font-mono">
            <span className="flex items-center gap-1.5 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Master Session
            </span>
            <span className="text-[9px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-black">
              SUPERUSER
            </span>
          </div>

          {/* Admin Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={twMerge(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-purple-500/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={twMerge(
                        'w-4 h-4 transition-transform group-hover:scale-110',
                        isActive ? 'text-purple-300' : 'text-white/60 group-hover:text-white'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm bg-purple-500/40 text-purple-200 font-mono">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase font-bold tracking-wider">
                      ML
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Link to View Live Consumer Website */}
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all mt-4 border border-white/5"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Open Consumer Site</span>
              </div>
              <span className="text-[9px] text-cyan-400 font-mono">LIVE</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Admin Area & Sign Out */}
        <div className="pt-3 border-t border-purple-500/20 space-y-2.5">
          <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">System Admin</p>
              <p className="text-[10px] text-white/50 font-mono">@admin (Root)</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border border-rose-500/25"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Sign Out of Admin Console</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Top Mobile Bar */}
        <header className="md:hidden glass sticky top-0 z-30 px-4 py-3 border-b border-purple-500/20 bg-[#0d091a]/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span className="font-black text-sm text-white font-mono">
              MediaGram Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-white/60 hover:text-white p-1.5"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={handleAdminLogout}
              className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
