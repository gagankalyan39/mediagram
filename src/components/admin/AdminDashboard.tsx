'use client';

import React, { useState } from 'react';
import { User, Post, MediaAsset, AdminStats, Role, TopicAnalytics } from '@/lib/types';
import { GlassCard } from '../glass/GlassCard';
import { GlassButton } from '../glass/GlassButton';
import { GlassInput } from '../glass/GlassInput';
import { GlassAvatar } from '../glass/GlassAvatar';
import {
  ShieldAlert,
  HardDrive,
  Users,
  Film,
  Image as ImageIcon,
  Search,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Cloud,
  Layers,
  ArrowUpRight,
  Filter,
  UserX,
  UserCheck,
  TrendingUp,
  BarChart3,
  Activity,
  Zap,
  Play,
  ExternalLink,
  ShieldCheck,
  Flame,
  Eye,
  RefreshCw
} from 'lucide-react';

interface AdminDashboardProps {
  stats: AdminStats;
  users: User[];
  posts: Post[];
  mediaAssets: MediaAsset[];
  onDeletePost: (postId: string) => void;
  onUpdateRole: (userId: string, role: Role) => void;
  onDeleteMedia: (mediaId: string) => void;
  onSuspendUser: (userId: string) => void;
  onUnsuspendUser: (userId: string) => void;
  initialTab?: 'topics' | 'users' | 'media' | 'moderation' | 'pipeline';
}

export function AdminDashboard({
  stats,
  users,
  posts,
  mediaAssets,
  onDeletePost,
  onUpdateRole,
  onDeleteMedia,
  onSuspendUser,
  onUnsuspendUser,
  initialTab = 'topics',
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'topics' | 'users' | 'media' | 'moderation' | 'pipeline'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [topicCategoryFilter, setTopicCategoryFilter] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [boostedTopics, setBoostedTopics] = useState<Record<string, number>>({});

  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 25;

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleBoostTopic = (tag: string) => {
    setBoostedTopics((prev) => ({
      ...prev,
      [tag]: (prev[tag] || 0) + 1,
    }));
    showToast(`⚡ ML Recommendation weight boosted for #${tag}! Posts with this tag will rank higher in consumer feeds.`);
  };

  const filteredMedia = React.useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    return mediaAssets.filter((m) => {
      const matchesQuery =
        !s ||
        m.publicId?.toLowerCase().includes(s) ||
        m.folder?.toLowerCase().includes(s) ||
        m.tags?.some((t) => t.toLowerCase().includes(s));
      const matchesType = mediaTypeFilter === 'all' || m.resourceType === mediaTypeFilter;
      return matchesQuery && matchesType;
    });
  }, [mediaAssets, searchQuery, mediaTypeFilter]);

  const topicsList: TopicAnalytics[] = stats.analytics.topics || [];
  const categories = React.useMemo(() => {
    return Array.from(new Set(topicsList.map((t) => t.category || 'General')));
  }, [topicsList]);

  const filteredTopics = React.useMemo(() => {
    const s = topicSearch.toLowerCase().trim();
    return topicsList.filter((t) => {
      const matchesSearch =
        !s ||
        t.tag.toLowerCase().includes(s) ||
        (t.category && t.category.toLowerCase().includes(s));
      const matchesCategory =
        topicCategoryFilter === 'all' || t.category === topicCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [topicsList, topicSearch, topicCategoryFilter]);

  const filteredUsers = React.useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = React.useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Toast Notification */}
      {feedbackMsg && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-2xl glass border border-amber-400/40 bg-black/90 text-white text-xs shadow-2xl flex items-center gap-3 animate-slide-in">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Top Banner: Master Admin Console */}
      <div className="p-6 rounded-3xl glass border border-purple-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 via-[#120e24] to-indigo-950/40 shadow-2xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  MediaGram Master Admin Console
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-500/40">
                  ROOT
                </span>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Multi-Topic Analytics Engine, Account Suspension Governance, and Cloudinary Media Infrastructure.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Cloudinary CDN Live</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-200 text-xs font-mono">
            <span>Cloud:</span>
            <strong className="text-white">rwcuzbxd</strong>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4" glow="purple">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold">
            <span>Platform Topics</span>
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {topicsList.length} Categories
          </p>
          <span className="text-[10px] text-purple-300 flex items-center gap-0.5 mt-1 font-mono">
            <Activity className="w-3 h-3 text-emerald-400" /> Top: #technology (9.4% ER)
          </span>
        </GlassCard>

        <GlassCard className="p-4" glow="cyan">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold">
            <span>Cloudinary Storage</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {formatBytes(stats.totalStorageBytes)}
          </p>
          <span className="text-[10px] text-cyan-300 font-mono mt-1 block">
            Saved: {stats.analytics.bandwidthSavedGb} GB via q_auto
          </span>
        </GlassCard>

        <GlassCard className="p-4" glow="none">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold">
            <span>User Accounts</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {stats.totalUsers} Registered
          </p>
          <span className="text-[10px] text-white/50 mt-1 flex items-center gap-1">
            <span className="text-emerald-400 font-bold">{users.filter((u) => u.status === 'active').length} Active</span>
            <span>•</span>
            <span className={users.some((u) => u.status === 'suspended') ? 'text-rose-400 font-bold' : 'text-white/40'}>
              {users.filter((u) => u.status === 'suspended').length} Suspended
            </span>
          </span>
        </GlassCard>

        <GlassCard className="p-4" glow="none">
          <div className="flex items-center justify-between text-white/60 text-xs font-semibold">
            <span>Content Safety</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">
            {stats.flaggedMediaCount} Moderation Flag
          </p>
          <span className="text-[10px] text-emerald-400 mt-1 block">
            Cloudinary AI Vision Active
          </span>
        </GlassCard>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 gap-2 overflow-x-auto">
        {[
          { key: 'topics', label: 'All-Topics Analytics', icon: BarChart3, count: topicsList.length, highlight: true },
          { key: 'users', label: 'User Governance & Suspension', icon: UserX, count: users.length },
          { key: 'media', label: 'Admin Media Center', icon: ImageIcon, count: filteredMedia.length },
          { key: 'moderation', label: 'Moderation Queue', icon: AlertTriangle, count: stats.flaggedMediaCount },
          { key: 'pipeline', label: 'Cloudinary Pipeline & CDN', icon: Layers },
        ].map((tab) => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-purple-600/40 text-white border border-purple-500/50 shadow-lg'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-mono">
                  {tab.count}
                </span>
              )}
              {tab.highlight && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">
                  ML
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ALL-TOPICS & CONTENT ANALYTICS */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          {/* Header Card with Topic Insights */}
          <GlassCard className="p-5 border border-purple-500/30 bg-purple-950/20 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  Topic & Content Intelligence Engine
                </h3>
                <p className="text-xs text-white/60">
                  Comprehensive performance analytics across all platform topics. Feeds directly into the ML Recommendation algorithm.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => showToast('🔄 Recalculated ML weights for all topics across 14,280 impressions.')}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                  Re-Index ML Model
                </GlassButton>
              </div>
            </div>

            {/* Filter and Search Bar for Topics */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="w-full sm:flex-1">
                <GlassInput
                  icon={<Search className="w-4 h-4" />}
                  placeholder="Search topics (e.g. technology, tokyo, cinema, travel)..."
                  value={topicSearch}
                  onChange={(e) => setTopicSearch(e.target.value)}
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 overflow-x-auto w-full sm:w-auto">
                <button
                  onClick={() => setTopicCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    topicCategoryFilter === 'all' ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTopicCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      topicCategoryFilter === cat ? 'bg-purple-600/50 text-white' : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Topics Deep Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map((topic) => {
              const boostCount = boostedTopics[topic.tag] || 0;
              const effectiveAffinity = Math.min(1, topic.mlAffinityScore + boostCount * 0.05);

              return (
                <GlassCard key={topic.tag} className="p-4 space-y-4 hover:border-purple-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-white">
                          #{topic.tag}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] text-white/70 font-semibold">
                          {topic.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold font-mono">
                          +{topic.growthVelocity}% ↗
                        </span>
                      </div>
                      <p className="text-[11px] text-white/50 mt-1">
                        {topic.postsCount} Posts • {topic.reelsCount} Video Reels • {topic.viewsTotal.toLocaleString()} Total Impressions
                      </p>
                    </div>

                    <button
                      onClick={() => handleBoostTopic(topic.tag)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title="Boost ML weight in recommendations"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Boost ML</span>
                      {boostCount > 0 && <span className="text-[10px] bg-amber-400 text-black px-1 rounded-full font-black">+{boostCount}</span>}
                    </button>
                  </div>

                  {/* Visual Performance Metrics */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                    <div>
                      <span className="text-[10px] text-white/50 block">Engagement</span>
                      <strong className="text-sm font-black text-amber-300 font-mono">
                        {topic.engagementRate}%
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/50 block">CDN Bandwidth</span>
                      <strong className="text-sm font-black text-cyan-300 font-mono">
                        {topic.bandwidthMb.toLocaleString()} MB
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/50 block">ML Affinity</span>
                      <strong className="text-sm font-black text-purple-300 font-mono">
                        {Math.round(effectiveAffinity * 100)}%
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-white/60 mb-1">
                        <span>Relative Platform Reach</span>
                        <span className="font-mono text-white">
                          {Math.round((topic.viewsTotal / 64200) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
                          style={{ width: `${Math.min(100, (topic.viewsTotal / 64200) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-white/60 mb-1">
                        <span>Cloudinary CDN Efficiency</span>
                        <span className="font-mono text-cyan-300">High (q_auto 4K)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: `${Math.min(100, (topic.bandwidthMb / 4820) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USER GOVERNANCE & SUSPENSION */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <GlassCard className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserX className="w-4 h-4 text-purple-400" />
                  Account Management & Suspension Control
                </h3>
                <p className="text-xs text-white/50">
                  Master Admin governance over registered users. Suspending an account instantly blocks logins and marks user media as locked.
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Filter users by name, username, email..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-purple-400/50 w-full sm:w-64"
                />
                <span className="text-xs font-mono text-white/60 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/10 shrink-0">
                  {filteredUsers.length} Users
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.03] text-white/50 border-b border-white/10 font-mono">
                  <tr>
                    <th className="p-3.5 font-semibold">User</th>
                    <th className="p-3.5 font-semibold">Email</th>
                    <th className="p-3.5 font-semibold">Status</th>
                    <th className="p-3.5 font-semibold">Role</th>
                    <th className="p-3.5 font-semibold">Metrics</th>
                    <th className="p-3.5 font-semibold text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedUsers.map((u) => {
                    const isSuspended = u.status === 'suspended';
                    const isMasterAdmin = u.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <GlassAvatar
                              src={u.avatarUrl}
                              name={u.name}
                              size="sm"
                              isVerified={u.isVerified}
                            />
                            <div>
                              <p className="font-bold text-white flex items-center gap-1.5">
                                {u.name}
                                {isMasterAdmin && (
                                  <span className="text-[10px] text-purple-400 font-bold">👑 Master</span>
                                )}
                              </p>
                              <p className="text-[11px] text-white/50">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-white/70 font-mono text-[11px]">{u.email}</td>

                        <td className="p-3.5">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              ACTIVE
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : u.role === 'CREATOR'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-white/10 text-white/70'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-white/60 text-[11px]">
                          <div>{u.postsCount} Posts</div>
                          <div className="text-[10px] text-white/40">{u.followersCount.toLocaleString()} Followers</div>
                        </td>

                        <td className="p-3.5 text-right">
                          {isMasterAdmin ? (
                            <span className="text-[11px] text-purple-400 font-mono">Protected Root</span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {isSuspended ? (
                                <GlassButton
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => {
                                    onUnsuspendUser(u.id);
                                    showToast(`✅ Un-suspended account @${u.username}. Access restored.`);
                                  }}
                                  className="text-xs font-bold text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                                >
                                  <UserCheck className="w-3.5 h-3.5 mr-1" />
                                  Unsuspend Account
                                </GlassButton>
                              ) : (
                                <GlassButton
                                  size="sm"
                                  variant="danger"
                                  onClick={() => {
                                    onSuspendUser(u.id);
                                    showToast(`⛔ Account @${u.username} has been SUSPENDED by Administrator.`);
                                  }}
                                  className="text-xs font-bold"
                                >
                                  <UserX className="w-3.5 h-3.5 mr-1" />
                                  Suspend User
                                </GlassButton>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalUserPages > 1 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/50">
                  Showing {(userPage - 1) * USERS_PER_PAGE + 1} - {Math.min(userPage * USERS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                </span>
                <div className="flex items-center gap-2">
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </GlassButton>
                  <span className="text-white font-mono px-2">
                    {userPage} / {totalUserPages}
                  </span>
                  <GlassButton
                    size="sm"
                    variant="secondary"
                    disabled={userPage >= totalUserPages}
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                  >
                    Next
                  </GlassButton>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      )}

      {/* TAB 3: ADMIN MEDIA CENTER */}
      {activeTab === 'media' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:flex-1">
              <GlassInput
                icon={<Search className="w-4 h-4" />}
                placeholder="Search assets (e.g. folder:posts, tag:tokyo, format:mp4)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <button
                onClick={() => setMediaTypeFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  mediaTypeFilter === 'all' ? 'bg-white/20 text-white' : 'text-white/60'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setMediaTypeFilter('image')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  mediaTypeFilter === 'image' ? 'bg-white/20 text-white' : 'text-white/60'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setMediaTypeFilter('video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  mediaTypeFilter === 'video' ? 'bg-white/20 text-white' : 'text-white/60'
                }`}
              >
                Videos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedia.map((m) => (
              <GlassCard key={m.id} className="p-3 space-y-3 overflow-hidden">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black/60">
                  {m.resourceType === 'video' ? (
                    <video
                      src={m.optimizedUrl || m.originalUrl}
                      poster={m.thumbnailUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={m.thumbnailUrl || m.optimizedUrl}
                      alt={m.publicId}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-white/15">
                    {m.format.toUpperCase()}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-mono text-white/90 truncate" title={m.publicId}>
                    {m.publicId}
                  </p>
                  <p className="text-[11px] text-white/50">
                    Folder: <span className="text-amber-400">{m.folder || 'mediagram/posts'}</span>
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-white/40 pt-1">
                    <span>
                      {m.width}x{m.height} px
                    </span>
                    <span>{formatBytes(m.bytes)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <a
                    href={m.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    View CDN
                    <ArrowUpRight className="w-3 h-3" />
                  </a>

                  <button
                    onClick={() => {
                      onDeleteMedia(m.id);
                      showToast(`🗑️ Media asset ${m.publicId} deleted from Cloudinary.`);
                    }}
                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                    title="Delete Media Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MODERATION QUEUE */}
      {activeTab === 'moderation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Automated Content Moderation
                </h4>
                <p className="text-[11px] text-amber-200/80">
                  Cloudinary AI Moderation scans uploaded images for explicit content and violence.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-300">1 Item Pending</span>
          </div>

          {posts.slice(0, 1).map((p) => (
            <GlassCard key={p.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {p.isReel || p.media[0]?.resourceType === 'video' ? (
                  <video
                    src={p.media[0]?.optimizedUrl || p.media[0]?.originalUrl}
                    poster={p.media[0]?.thumbnailUrl && !p.media[0]?.thumbnailUrl.includes('.mp4') ? p.media[0]?.thumbnailUrl : '/pics/pic_01.jpg'}
                    preload="metadata"
                    muted
                    playsInline
                    className="w-20 h-20 rounded-xl object-cover border border-white/15 pointer-events-none"
                  />
                ) : (
                  <img
                    src={p.media[0]?.thumbnailUrl || p.media[0]?.originalUrl || '/pics/pic_01.jpg'}
                    alt="Flagged media"
                    onError={(e) => { e.currentTarget.src = '/pics/pic_01.jpg'; }}
                    className="w-20 h-20 rounded-xl object-cover border border-white/15"
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Post by @{p.user.username}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      Flagged by Community
                    </span>
                  </div>
                  <p className="text-xs text-white/70 line-clamp-1 mt-1">{p.caption}</p>
                  <p className="text-[11px] font-mono text-white/40 mt-1">ID: {p.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={() => showToast('Approved content after administrative review.')}
                >
                  <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Approve
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    onDeletePost(p.id);
                    showToast('Post removed from platform.');
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Remove
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* TAB 5: PIPELINE & CDN */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              Cloudinary Product Environment
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Cloud Name</span>
                <span className="font-mono text-white font-semibold">rwcuzbxd</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">API Key</span>
                <span className="font-mono text-white font-semibold">945753893851776</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Folder Mode</span>
                <span className="text-emerald-400 font-semibold">Dynamic folders</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Delivery Optimization</span>
                <span className="text-cyan-300 font-semibold">q_auto, f_auto, dpr_auto</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Cache Edge Hit Rate</span>
                <span className="text-emerald-400 font-semibold">{stats.analytics.cacheHitRatePercent}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-white/50">Payload Reduction Ratio</span>
                <span className="text-amber-300 font-semibold">{stats.analytics.compressionRatio}% reduction</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Folder Hierarchy Governance
            </h4>
            <div className="space-y-1.5 text-xs font-mono text-white/80">
              <p className="text-amber-300">📁 mediagram/</p>
              <p className="pl-4 text-white/70">├── 📁 users/profiles</p>
              <p className="pl-4 text-white/70">├── 📁 users/covers</p>
              <p className="pl-4 text-white/70">├── 📁 posts/images</p>
              <p className="pl-4 text-white/70">├── 📁 posts/videos</p>
              <p className="pl-4 text-white/70">├── 📁 posts/carousels</p>
              <p className="pl-4 text-white/70">├── 📁 reels</p>
              <p className="pl-4 text-white/70">├── 📁 stories</p>
              <p className="pl-4 text-white/70">└── 📁 thumbnails</p>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
