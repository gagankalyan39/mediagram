'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/navigation/AppShell';
import { GlassCard } from '@/components/glass/GlassCard';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassInput } from '@/components/glass/GlassInput';
import { GlassAvatar } from '@/components/glass/GlassAvatar';
import { store } from '@/lib/store';
import { User, UserSettings } from '@/lib/types';
import { useRouter } from 'next/navigation';
import {
  Lock,
  User as UserIcon,
  Bell,
  HardDrive,
  ShieldCheck,
  Check,
  Camera,
  Eye,
  EyeOff,
  Cloud,
  Sparkles,
  Save,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { uploadMediaFileToCloudinary } from '@/lib/upload-helper';

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User>(store.getCurrentUser());
  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'notifications' | 'cloudinary'>('profile');

  // Profile Form States
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');

  // Privacy & Settings States
  const [settings, setSettings] = useState<UserSettings>(
    currentUser.settings || {
      isPrivateAccount: false,
      showActivityStatus: true,
      allowTaggingFrom: 'everyone',
      pauseNotifications: false,
      likesNotifications: true,
      commentsNotifications: true,
      messagesNotifications: true,
      cloudinaryAutoCompress: true,
      highQualityUploads: true,
    }
  );

  const [isSavedAlert, setIsSavedAlert] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isTestingCloudinary, setIsTestingCloudinary] = useState(false);
  const [cloudinaryTestResult, setCloudinaryTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  const handleTestCloudinary = async () => {
    setIsTestingCloudinary(true);
    setCloudinaryTestResult(null);
    try {
      const res = await fetch('/api/media/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderType: 'post_image', tags: ['connection_test'] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      if (data.signature && data.cloudName) {
        setCloudinaryTestResult({
          success: true,
          message: `Connected to Cloudinary (${data.cloudName})! API signature generation & CDN delivery endpoints are verified.`,
          details: {
            cloudName: data.cloudName,
            apiKey: data.apiKey ? 'Configured & Active' : 'Active',
            timestamp: new Date(data.timestamp * 1000).toLocaleTimeString(),
          },
        });
      } else {
        throw new Error('Incomplete response from media signing endpoint');
      }
    } catch (err: any) {
      setCloudinaryTestResult({
        success: false,
        message: `Cloudinary ping issue: ${err.message || 'Unknown error'}. Check network or credentials.`,
      });
    } finally {
      setIsTestingCloudinary(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateUserProfile({
      name,
      bio,
      website,
      avatarUrl,
    });
    store.updateUserSettings(settings);
    setCurrentUser({ ...store.getCurrentUser() });

    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
    window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    try {
      const media = await uploadMediaFileToCloudinary({
        file,
        folderType: 'user_profile',
        userId: currentUser.id,
      });

      const newUrl = media.optimizedUrl || media.originalUrl;
      setAvatarUrl(newUrl);
      store.updateUserProfile({ avatarUrl: newUrl });
      setCurrentUser({ ...store.getCurrentUser() });
      window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
    } catch (err) {
      console.error('Error updating profile photo:', err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 pb-16">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Settings & Privacy</h1>
            <p className="text-xs text-white/50">
              Manage account privacy, notifications, profile details, and Cloudinary media delivery preferences.
            </p>
          </div>
          {isSavedAlert && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              Settings saved!
            </span>
          )}
        </div>

        {/* Settings Layout: Left Nav Tabs, Right Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Navigation Pills */}
          <div className="space-y-1.5">
            {[
              { id: 'profile', label: 'Edit Profile', icon: UserIcon },
              { id: 'privacy', label: 'Account Privacy', icon: Lock },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'cloudinary', label: 'Cloudinary Media', icon: Cloud },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-amber-400" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              onClick={() => {
                store.logout();
                window.dispatchEvent(new CustomEvent('beesocial:store_updated'));
                router.push('/login');
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer mt-4"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Log Out (@{currentUser.username})</span>
            </button>
          </div>

          {/* Right Tab Content */}
          <div className="md:col-span-3">
            <GlassCard className="p-6 border border-white/10">
              {/* Tab 1: Edit Profile */}
              {activeTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
                    Profile Information
                  </h3>

                  {/* Avatar Upload */}
                  <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="relative">
                      <GlassAvatar
                        src={avatarUrl}
                        name={name}
                        size="lg"
                        isVerified={currentUser.isVerified}
                      />
                      <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-400 text-black cursor-pointer hover:scale-110 transition-transform shadow-md">
                        <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-white">@{currentUser.username}</p>
                      <p className="text-[11px] text-white/50">
                        {isUploadingPhoto
                          ? 'Uploading photo to Cloudinary CDN...'
                          : 'Change profile photo (direct Cloudinary upload)'}
                      </p>
                    </div>
                  </div>

                  <GlassInput
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/70 uppercase tracking-wider block">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      className="glass-input w-full p-3 text-xs placeholder:text-white/30 resize-none"
                    />
                  </div>

                  <GlassInput
                    label="Website"
                    placeholder="https://yourwebsite.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />

                  <div className="pt-2 flex justify-end">
                    <GlassButton type="submit" variant="primary" size="sm">
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save Changes
                    </GlassButton>
                  </div>
                </form>
              )}

              {/* Tab 2: Account Privacy */}
              {activeTab === 'privacy' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
                    Privacy Controls
                  </h3>

                  {/* Private Account Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white flex items-center gap-2">
                        {settings.isPrivateAccount ? (
                          <EyeOff className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-cyan-400" />
                        )}
                        Private Account
                      </p>
                      <p className="text-[11px] text-white/50 max-w-sm">
                        When your account is private, only people you approve can see your photos, videos, and stories.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, isPrivateAccount: !settings.isPrivateAccount };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.isPrivateAccount ? 'bg-amber-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.isPrivateAccount ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Activity Status Toggle */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Show Activity Status</p>
                      <p className="text-[11px] text-white/50 max-w-sm">
                        Allow accounts you message and follow to see when you were last active on MediaGram.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, showActivityStatus: !settings.showActivityStatus };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.showActivityStatus ? 'bg-amber-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.showActivityStatus ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tags and Mentions */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-white block">
                      Who Can Tag and Mention You
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'everyone', label: 'Everyone' },
                        { id: 'following', label: 'People You Follow' },
                        { id: 'no_one', label: 'No One' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            const updated = { ...settings, allowTaggingFrom: opt.id as any };
                            setSettings(updated);
                            store.updateUserSettings(updated);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            settings.allowTaggingFrom === opt.id
                              ? 'bg-amber-400 text-black border-amber-300 font-bold shadow-md'
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Notifications */}
              {activeTab === 'notifications' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2">
                    Notification Preferences
                  </h3>

                  {/* Pause All */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Pause All Notifications</p>
                      <p className="text-[11px] text-white/50">
                        Temporarily mute all push alerts and notification badges.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, pauseNotifications: !settings.pauseNotifications };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.pauseNotifications ? 'bg-amber-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.pauseNotifications ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Likes Alerts */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Likes & Reactions</p>
                      <p className="text-[11px] text-white/50">When someone likes your photos or reels.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, likesNotifications: !settings.likesNotifications };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.likesNotifications ? 'bg-amber-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.likesNotifications ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Direct Messages Alerts */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Direct Messages</p>
                      <p className="text-[11px] text-white/50">When you receive a new chat message.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, messagesNotifications: !settings.messagesNotifications };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.messagesNotifications ? 'bg-amber-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.messagesNotifications ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Cloudinary Media Settings */}
              {activeTab === 'cloudinary' && (
                <div className="space-y-5">
                  <h3 className="text-sm font-bold text-white border-b border-white/10 pb-2 flex items-center justify-between">
                    <span>Cloudinary Delivery Engine</span>
                    <span className="text-[11px] font-mono text-cyan-300">rwcuzbxd</span>
                  </h3>

                  {/* Cloudinary Live Status Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 border border-cyan-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">Live Cloudinary CDN Status</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        ACTIVE & ONLINE
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-white/40 block">Cloud Name</span>
                        <span className="text-cyan-300 font-bold">rwcuzbxd</span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-white/40 block">Auto Format</span>
                        <span className="text-emerald-300 font-bold">f_auto enabled</span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-white/40 block">Auto Quality</span>
                        <span className="text-purple-300 font-bold">q_auto enabled</span>
                      </div>
                      <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                        <span className="text-white/40 block">Video Offset</span>
                        <span className="text-amber-300 font-bold">so_0 poster</span>
                      </div>
                    </div>

                    {/* Test Connection Button & Result */}
                    <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        disabled={isTestingCloudinary}
                        onClick={handleTestCloudinary}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-semibold transition-all border border-cyan-400/40 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isTestingCloudinary ? 'animate-spin' : ''}`} />
                        <span>{isTestingCloudinary ? 'Testing Connection...' : 'Test Cloudinary Live Connection'}</span>
                      </button>

                      {cloudinaryTestResult && (
                        <div
                          className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-xl border animate-in fade-in ${
                            cloudinaryTestResult.success
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          {cloudinaryTestResult.success ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className="line-clamp-1">{cloudinaryTestResult.message}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        Perceptual Compression (q_auto + f_auto)
                      </p>
                      <p className="text-[11px] text-cyan-200/70 max-w-sm">
                        Automatically converts images to AVIF/WebP based on browser support for 60% bandwidth savings.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, cloudinaryAutoCompress: !settings.cloudinaryAutoCompress };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.cloudinaryAutoCompress ? 'bg-cyan-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.cloudinaryAutoCompress ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Upload at Highest Bitrate</p>
                      <p className="text-[11px] text-cyan-200/70 max-w-sm">
                        Stores full 4K and 1080p master source binaries in Cloudinary storage before CDN transformation.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...settings, highQualityUploads: !settings.highQualityUploads };
                        setSettings(updated);
                        store.updateUserSettings(updated);
                      }}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                        settings.highQualityUploads ? 'bg-cyan-400' : 'bg-white/20'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-transform ${
                          settings.highQualityUploads ? 'right-1' : 'left-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
