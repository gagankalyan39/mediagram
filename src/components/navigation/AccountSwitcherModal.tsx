'use client';

import React from 'react';
import { GlassModal } from '../glass/GlassModal';
import { GlassAvatar } from '../glass/GlassAvatar';
import { GlassButton } from '../glass/GlassButton';
import { User } from '@/lib/types';
import { Check, Shield, User as UserIcon, Sparkles, ArrowRightLeft } from 'lucide-react';

interface AccountSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onCreateAccount?: (userData: any) => void;
}

export function AccountSwitcherModal({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSelectUser,
}: AccountSwitcherModalProps) {
  const customerUser = allUsers.find((u) => u.role === 'USER') || allUsers[0];
  const adminUser = allUsers.find((u) => u.role === 'ADMIN') || allUsers[1];

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Switch User Role" maxWidth="md">
      <div className="space-y-4">
        <p className="text-xs text-white/60">
          MediaGram operates with 2 distinct user accounts: <strong>Customer</strong> and <strong>Master Admin</strong>.
        </p>

        {/* 2-Account Cards */}
        <div className="space-y-3">
          {/* 1. Customer Account */}
          {customerUser && (
            <div
              onClick={() => {
                onSelectUser(customerUser);
                onClose();
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                currentUser.id === customerUser.id
                  ? 'bg-amber-400/10 border-amber-400/60 shadow-lg shadow-amber-400/10'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <GlassAvatar
                    src={customerUser.avatarUrl}
                    name={customerUser.name}
                    size="md"
                    isVerified={customerUser.isVerified}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{customerUser.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold uppercase">
                        Customer
                      </span>
                    </div>
                    <p className="text-xs text-white/50">@{customerUser.username}</p>
                  </div>
                </div>

                {currentUser.id === customerUser.id ? (
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 font-semibold transition-opacity flex items-center gap-1">
                    Select <ArrowRightLeft className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/70">
                <p>👤 <strong>Role Scope:</strong> Browse feed, watch reels, post media to Cloudinary, add stories, write comments & like posts.</p>
              </div>
            </div>
          )}

          {/* 2. Admin Account */}
          {adminUser && (
            <div
              onClick={() => {
                onSelectUser(adminUser);
                onClose();
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                currentUser.id === adminUser.id
                  ? 'bg-purple-600/15 border-purple-500/60 shadow-lg shadow-purple-500/15'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <GlassAvatar
                    src={adminUser.avatarUrl}
                    name={adminUser.name}
                    size="md"
                    isVerified={adminUser.isVerified}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{adminUser.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/30 text-purple-300 border border-purple-500/40 font-bold uppercase flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5 text-purple-400" />
                        Admin
                      </span>
                    </div>
                    <p className="text-xs text-white/50">@{adminUser.username}</p>
                  </div>
                </div>

                {currentUser.id === adminUser.id ? (
                  <div className="w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-xs text-purple-300 opacity-0 group-hover:opacity-100 font-semibold transition-opacity flex items-center gap-1">
                    Select <ArrowRightLeft className="w-3 h-3" />
                  </span>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-white/5 text-[11px] text-white/70">
                <p>🛡️ <strong>Role Scope:</strong> Controls whole platform, Admin Media Center, delete any post, review moderation queue & inspect Cloudinary storage.</p>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <GlassButton variant="ghost" size="sm" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
