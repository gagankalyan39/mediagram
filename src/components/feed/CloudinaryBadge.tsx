'use client';

import React, { useState } from 'react';
import { MediaAsset } from '@/lib/types';
import { Cloud, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import { GlassModal } from '../glass/GlassModal';

interface CloudinaryBadgeProps {
  media: MediaAsset;
}

export function CloudinaryBadge({ media }: CloudinaryBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '450 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <button
        onClick={() => setShowDetails(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 text-[11px] font-medium transition-all group cursor-pointer shadow-sm"
        title="View Cloudinary Media Lifecycle Info"
      >
        <Cloud className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
        <span>Cloudinary {media.format?.toUpperCase() || 'WEBP'}</span>
        <span className="text-cyan-400/50">•</span>
        <span className="text-cyan-200/90">{formatBytes(media.bytes)}</span>
      </button>

      <GlassModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        title="Cloudinary Media Lifecycle Inspector"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Cloudinary Delivery Pipeline
                </h4>
                <p className="text-[11px] text-cyan-300">
                  Transformed via q_auto, f_auto & responsive CDN
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              OPTIMIZED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Public ID</span>
              <span className="text-white/90 font-mono text-[11px] break-all">
                {media.publicId || media.id}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Resource Type</span>
              <span className="text-white/90 font-semibold uppercase">
                {media.resourceType || 'image'} ({media.format || 'webp'})
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Resolution</span>
              <span className="text-white/90 font-semibold">
                {media.width || 1080} x {media.height || 1350} px
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <span className="text-white/40 block text-[10px] uppercase font-bold">Optimized Size</span>
              <span className="text-white/90 font-semibold">{formatBytes(media.bytes)}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <span className="text-white/40 block text-[10px] uppercase font-bold">
              Folder Architecture
            </span>
            <p className="text-xs font-mono text-amber-300">
              {media.folder || 'mediagram/posts/images'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
            <span className="text-white/40 block text-[10px] uppercase font-bold">
              Active Cloudinary Transformations
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['q_auto (Perceptual Quality)', 'f_auto (Next-Gen WebP/AVIF)', 'c_fill (Smart Crop)', 'dpr_auto (HiDPI)', 'w_1080'].map(
                (tr) => (
                  <span
                    key={tr}
                    className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 font-mono text-[10px]"
                  >
                    {tr}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </GlassModal>
    </>
  );
}
