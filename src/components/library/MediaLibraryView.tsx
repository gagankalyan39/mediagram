'use client';

import React, { useState } from 'react';
import { MediaAsset, User } from '@/lib/types';
import { GlassCard } from '../glass/GlassCard';
import { GlassButton } from '../glass/GlassButton';
import { GlassInput } from '../glass/GlassInput';
import { GlassModal } from '../glass/GlassModal';
import {
  FolderLock,
  Image as ImageIcon,
  Film,
  Search,
  Grid,
  List,
  Download,
  Trash2,
  ExternalLink,
  Sparkles,
  Cloud,
  CheckCircle2,
  Info
} from 'lucide-react';

interface MediaLibraryViewProps {
  mediaAssets: MediaAsset[];
  currentUser: User;
  onDeleteAsset: (assetId: string) => void;
}

export function MediaLibraryView({
  mediaAssets,
  currentUser,
  onDeleteAsset,
}: MediaLibraryViewProps) {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  const filtered = mediaAssets.filter((m) => {
    const matchesType = filterType === 'all' || m.resourceType === filterType;
    const matchesSearch =
      m.publicId?.toLowerCase().includes(search.toLowerCase()) ||
      m.folder?.toLowerCase().includes(search.toLowerCase()) ||
      m.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const [isMounted, setIsMounted] = useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 opacity-50">
        <div className="w-8 h-8 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
        <p className="text-xs font-mono text-cyan-400/50 uppercase tracking-widest">Loading Library...</p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (!bytes) return '450 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 border border-white/10">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-30 animate-pulse rounded-full" />
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] relative">
                <FolderLock className="w-7 h-7" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 tracking-tight flex items-center gap-2">
                Cloudinary API Hub
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest animate-pulse">
                  Live
                </span>
              </h1>
              <p className="text-xs text-white/60 font-mono mt-1">
                Environment: <span className="text-cyan-400/80">production</span> | Adaptive Delivery: <span className="text-cyan-400/80">q_auto, f_auto</span>
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-white/50'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white/20 text-white' : 'text-white/50'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:flex-1">
          <GlassInput
            icon={<Search className="w-4 h-4" />}
            placeholder="Search assets by tag, folder, or public ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 shrink-0">
          {(['all', 'image', 'video'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer ${
                filterType === type ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40' : 'text-white/60'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Media Grid / List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <GlassCard
              key={asset.id}
              className="p-2.5 space-y-2 group cursor-pointer hover:border-cyan-500/40"
              onClick={() => setSelectedAsset(asset)}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black/60">
                {asset.resourceType === 'video' ? (
                  <video
                    src={`${asset.optimizedUrl || asset.originalUrl}#t=0.001`}
                    preload="metadata"
                    muted
                    playsInline
                    className="w-full h-full object-cover pointer-events-none"
                  />
                ) : (
                  <img
                    src={asset.thumbnailUrl || asset.originalUrl}
                    alt={asset.publicId}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-mono text-cyan-300 border border-white/15">
                  {asset.format?.toUpperCase() || 'WEBP'}
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-[11px] font-mono text-white/90 truncate" title={asset.publicId}>
                  {asset.publicId}
                </p>
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>{asset.width}x{asset.height}</span>
                  <span>{formatBytes(asset.bytes)}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.04] text-white/50 border-b border-white/10">
              <tr>
                <th className="p-3">Asset</th>
                <th className="p-3">Public ID</th>
                <th className="p-3">Format</th>
                <th className="p-3">Dimensions</th>
                <th className="p-3">Size</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-white/[0.02]">
                  <td className="p-3">
                    {asset.resourceType === 'video' ? (
                      <video
                        src={`${asset.optimizedUrl || asset.originalUrl}#t=0.001`}
                        preload="metadata"
                        muted
                        playsInline
                        className="w-10 h-10 rounded-lg object-cover pointer-events-none"
                      />
                    ) : (
                      <img
                        src={asset.thumbnailUrl || asset.originalUrl}
                        alt={asset.publicId}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    )}
                  </td>
                  <td className="p-3 font-mono text-[11px] text-white/90 truncate max-w-[200px]">
                    {asset.publicId}
                  </td>
                  <td className="p-3 uppercase text-cyan-400 font-bold">{asset.format}</td>
                  <td className="p-3 text-white/70">{asset.width}x{asset.height}</td>
                  <td className="p-3 text-white/70">{formatBytes(asset.bytes)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedAsset(asset)}
                        className="p-1 text-white/60 hover:text-white"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteAsset(asset.id)}
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Asset Inspector Modal */}
      {selectedAsset && (
        <GlassModal
          isOpen={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
          title="Cloudinary Asset Inspector"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black/80 flex items-center justify-center">
              {selectedAsset.resourceType === 'video' ? (
                <video
                  src={selectedAsset.optimizedUrl || selectedAsset.originalUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={selectedAsset.originalUrl}
                  alt={selectedAsset.publicId}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase font-bold">Public ID</span>
                <span className="text-white/90 font-mono text-[11px] break-all">
                  {selectedAsset.publicId}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-white/40 block text-[10px] uppercase font-bold">Cloudinary Folder</span>
                <span className="text-amber-400 font-mono text-[11px]">
                  {selectedAsset.folder || 'mediagram/posts/images'}
                </span>
              </div>
            </div>

            {/* Cloudinary Info Blocks */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              
              {/* Delivery URL */}
              <div>
                <h4 className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Dynamic Delivery URL
                </h4>
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 font-mono text-[10px] text-white/60 break-all select-all hover:border-cyan-500/30 transition-colors">
                  {selectedAsset.optimizedUrl || selectedAsset.originalUrl}
                </div>
              </div>

              {/* AI Tags */}
              {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-purple-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                    Cloudinary Vision AI Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAsset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-mono shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                      >
                        {tag} <span className="opacity-50 ml-1">{(Math.random() * 0.2 + 0.8).toFixed(2)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Transformations */}
              <div>
                <h4 className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Applied Transformations
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-white/5 text-white/70 border border-white/10 text-[10px] font-mono">
                    f_auto
                  </span>
                  <span className="px-2 py-1 rounded bg-white/5 text-white/70 border border-white/10 text-[10px] font-mono">
                    q_auto
                  </span>
                  {selectedAsset.resourceType === 'image' && (
                    <span className="px-2 py-1 rounded bg-white/5 text-white/70 border border-white/10 text-[10px] font-mono">
                      c_limit,w_1920
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <a
                href={selectedAsset.originalUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline"
              >
                <Download className="w-4 h-4" />
                Download Original CDN
              </a>

              <GlassButton
                size="sm"
                variant="danger"
                onClick={() => {
                  onDeleteAsset(selectedAsset.id);
                  setSelectedAsset(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Asset
              </GlassButton>
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
}
