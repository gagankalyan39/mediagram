'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GlassModal } from '../glass/GlassModal';
import { GlassButton } from '../glass/GlassButton';
import { GlassInput } from '../glass/GlassInput';
import { MediaAsset, User } from '@/lib/types';
import { PRESET_VIDEO_CLIPS, PresetVideoClip } from '@/lib/video-library';
import { uploadMediaFileToCloudinary } from '@/lib/upload-helper';
import {
  UploadCloud,
  Image as ImageIcon,
  Film,
  Sparkles,
  MapPin,
  Tag,
  CheckCircle2,
  X,
  Music,
  Layers,
  Wand2,
  Play,
  Check,
  Video,
  Flame,
  Laugh,
  Eye,
  RefreshCw
} from 'lucide-react';
import { generateCloudinaryAIContext, CloudinaryAIContextResult, AICaptionTone } from '@/lib/cloudinary-ai';
import { getVideoPosterUrl } from '@/lib/cloudinary';
import { videoCoordinator } from '@/lib/video-coordinator';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onPostCreated: (postData: {
    caption: string;
    location?: string;
    media: MediaAsset[];
    tags: string[];
    isReel: boolean;
    audioTrackTitle?: string;
  }) => void;
  onStoryCreated: (mediaUrl: string, resourceType: 'image' | 'video') => void;
}

export function CreatePostModal({
  isOpen,
  onClose,
  currentUser,
  onPostCreated,
  onStoryCreated,
}: CreatePostModalProps) {
  useEffect(() => {
    if (isOpen) {
      videoCoordinator.setModalOpen(true);
      return () => {
        videoCoordinator.setModalOpen(false);
      };
    }
  }, [isOpen]);

  const [postType, setPostType] = useState<'feed' | 'reel' | 'story'>('feed');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [audioTrackTitle, setAudioTrackTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPresetClip, setSelectedPresetClip] = useState<PresetVideoClip | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
  const [aiContext, setAiContext] = useState<CloudinaryAIContextResult | null>(null);
  const [selectedTone, setSelectedTone] = useState<AICaptionTone>('cinematic');
  const [isClipPickerOpen, setIsClipPickerOpen] = useState(false);
  const [clipCategory, setClipCategory] = useState<'all' | 'dance' | 'pets' | 'art' | 'cinematics' | 'humor'>('all');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPresetClip(null);
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (file.type.startsWith('video/')) {
        setPostType('reel');
      }

      // Auto trigger AI tag/caption suggestion
      handleGenerateAICaption('cinematic', file.name, file.type.startsWith('video/'));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedPresetClip(null);
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      if (file.type.startsWith('video/')) {
        setPostType('reel');
      }
      handleGenerateAICaption('cinematic', file.name, file.type.startsWith('video/'));
    }
  };

  const handleSelectPresetClip = (clip: PresetVideoClip) => {
    setSelectedPresetClip(clip);
    setSelectedFile(null);
    setPreviewUrl(clip.videoUrl);
    setPostType('reel');
    setIsClipPickerOpen(false);
    handleGenerateAICaption('cinematic', clip.filename, true, clip);
  };

  // Cloudinary AI Caption & Auto-Tag Assistant
  const handleGenerateAICaption = (
    tone: AICaptionTone = selectedTone,
    hintFilename?: string,
    forcedIsVideo?: boolean,
    overrideClip?: PresetVideoClip | null
  ) => {
    setIsGeneratingCaption(true);
    setSelectedTone(tone);
    setTimeout(() => {
      const activeClip = overrideClip !== undefined ? overrideClip : selectedPresetClip;
      const isVideo =
        forcedIsVideo !== undefined
          ? forcedIsVideo
          : selectedFile?.type.startsWith('video/') || activeClip !== null || postType === 'reel';

      const fileName = hintFilename || selectedFile?.name || activeClip?.filename || '';

      const result = generateCloudinaryAIContext({
        file: selectedFile,
        filename: fileName,
        isVideo,
        tone,
        presetClip: activeClip,
        currentUserName: currentUser.name,
      });

      setAiContext(result);
      setCaption(result.caption);
      setTagsInput(result.tags.join(', '));
      setLocation(result.suggestedLocation);
      if (isVideo && result.audioTrackTitle) {
        setAudioTrackTitle(result.audioTrackTitle);
      }
      setIsGeneratingCaption(false);
    }, 350);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) return;

    setIsUploading(true);

    try {
      let mediaAsset: MediaAsset;

      const isVideo = selectedPresetClip !== null || (selectedFile?.type.startsWith('video/') || false);
      const folderType =
        postType === 'reel'
          ? 'reel'
          : postType === 'story'
          ? 'story'
          : isVideo
          ? 'post_video'
          : 'post_image';

      if (selectedPresetClip) {
        setUploadStep('Applying Cloudinary smart transformation pipeline [c_fill, g_auto, q_auto]...');
        await new Promise((r) => setTimeout(r, 250));

        setUploadStep('Cataloging video reel metadata in Cloudinary DAM...');
        await new Promise((r) => setTimeout(r, 250));

        mediaAsset = {
          id: `media_${Date.now()}`,
          userId: currentUser.id,
          assetId: `cld_${selectedPresetClip.id}`,
          publicId: `mediagram/reels/${selectedPresetClip.id}`,
          resourceType: 'video',
          format: 'mp4',
          width: 1080,
          height: 1920,
          duration: selectedPresetClip.duration,
          bytes: 4800000,
          originalUrl: selectedPresetClip.videoUrl,
          thumbnailUrl: getVideoPosterUrl(selectedPresetClip.videoUrl),
          optimizedUrl: selectedPresetClip.videoUrl,
          folder: 'mediagram/reels',
          tags: tagsInput.split(',').map((t) => t.trim().replace('#', '')).filter(Boolean),
          createdAt: new Date().toISOString(),
        };
      } else if (selectedFile) {
        mediaAsset = await uploadMediaFileToCloudinary({
          file: selectedFile,
          folderType,
          userId: currentUser.id,
          tags: tagsInput.split(',').map((t) => t.trim().replace('#', '')).filter(Boolean),
          onProgress: (status) => setUploadStep(status),
        });
      } else {
        const folder = `mediagram/${folderType}`;
        mediaAsset = {
          id: `media_${Date.now()}`,
          userId: currentUser.id,
          assetId: `cld_${Date.now()}`,
          publicId: `${folder}/${currentUser.username}_${Date.now()}`,
          resourceType: isVideo ? 'video' : 'image',
          format: isVideo ? 'mp4' : 'webp',
          width: 1080,
          height: isVideo ? 1920 : 1350,
          bytes: 450000,
          originalUrl: previewUrl,
          thumbnailUrl: isVideo ? getVideoPosterUrl(previewUrl) : previewUrl,
          optimizedUrl: previewUrl,
          folder,
          tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
          createdAt: new Date().toISOString(),
        };
      }

      setUploadStep('Publishing to MediaGram feeds & notifications...');
      await new Promise((r) => setTimeout(r, 200));

      if (postType === 'story') {
        onStoryCreated(mediaAsset.optimizedUrl || mediaAsset.originalUrl, isVideo ? 'video' : 'image');
      } else {
        onPostCreated({
          caption: caption.trim() || 'New upload on MediaGram ✨',
          location: location.trim() || undefined,
          media: [mediaAsset],
          tags: tagsInput.split(',').map((t) => t.trim().replace('#', '')).filter(Boolean),
          isReel: postType === 'reel' || isVideo,
          audioTrackTitle: audioTrackTitle.trim() || (isVideo ? `${currentUser.name} · Original Audio` : undefined),
        });
      }

      // Reset
      setSelectedFile(null);
      setSelectedPresetClip(null);
      setPreviewUrl(null);
      setCaption('');
      setLocation('');
      setTagsInput('');
      setAudioTrackTitle('');
      setIsUploading(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Upload error: ' + (err.message || 'Failed to upload to Cloudinary'));
      setIsUploading(false);
    }
  };

  // Filter preset clips
  const filteredPresetClips = PRESET_VIDEO_CLIPS.filter((clip) => {
    if (clipCategory === 'all') return true;
    if (clipCategory === 'dance') return clip.tags.some((t) => t.includes('dance') || t.includes('parrots'));
    if (clipCategory === 'pets') return clip.tags.some((t) => t.includes('cat') || t.includes('kitten') || t.includes('dog') || t.includes('bunny'));
    if (clipCategory === 'art') return clip.tags.some((t) => t.includes('art') || t.includes('illustration') || t.includes('doodle') || t.includes('typography'));
    if (clipCategory === 'cinematics') return clip.tags.some((t) => t.includes('tokyo') || t.includes('cinematics') || t.includes('4k'));
    if (clipCategory === 'humor') return clip.tags.some((t) => t.includes('funny') || t.includes('humor') || t.includes('comedy'));
    return true;
  });

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Create New MediaGram Post" maxWidth="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Post Type Selector: Feed Post vs Reel vs Story */}
        <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/10 gap-1">
          <button
            type="button"
            onClick={() => setPostType('feed')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              postType === 'feed'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Feed Post (Photo/Video)
          </button>

          <button
            type="button"
            onClick={() => setPostType('reel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              postType === 'reel'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            Instagram Reel (9:16)
          </button>

          <button
            type="button"
            onClick={() => setPostType('story')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              postType === 'story'
                ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-sm'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            24h Story
          </button>
        </div>

        {/* Cloudinary Source Selector: Upload from PC OR Choose from 33 Real Video Clips */}
        {!previewUrl && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option A: Upload from Device */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/20 hover:border-amber-400/60 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide">
                  UPLOAD FROM DEVICE
                </p>
                <p className="text-[10px] text-white/50 mt-0.5">
                  Stream JPG, PNG, WEBP, MP4 to Cloudinary CDN
                </p>
              </div>
              <span className="text-[11px] text-amber-300 font-semibold px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/20">
                Browse Files
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Option B: Choose from 33 Video Clips in VIDEOS folder */}
            <div
              onClick={() => setIsClipPickerOpen(true)}
              className="border-2 border-dashed border-purple-500/30 hover:border-purple-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 bg-purple-950/20 hover:bg-purple-900/30 transition-all cursor-pointer text-center group"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide flex items-center justify-center gap-1">
                  <span>VIDEO REEL LIBRARY</span>
                  <span className="text-[9px] bg-purple-500 text-white px-1.5 py-0.2 rounded font-mono">FEATURED</span>
                </p>
                <p className="text-[10px] text-purple-200/60 mt-0.5">
                  Choose from curated creator video reels
                </p>
              </div>
              <span className="text-[11px] text-purple-200 font-semibold px-2.5 py-1 rounded-lg bg-purple-500/30 border border-purple-500/40">
                Open Clips Library
              </span>
            </div>
          </div>
        )}

        {/* Media Preview Box */}
        {previewUrl && (
          <div className="relative rounded-2xl overflow-hidden glass border border-white/20 aspect-video max-h-[280px] flex items-center justify-center bg-black/80">
            {selectedPresetClip || selectedFile?.type.startsWith('video/') ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                muted
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-full h-full object-contain"
              />
            )}

            {/* Cloudinary Active Badge */}
            <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-cyan-500/40 text-[9px] text-cyan-300 font-mono flex items-center gap-1">
              <Layers className="w-2.5 h-2.5" />
              <span>Cloudinary Pipeline: f_auto, q_auto</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setSelectedPresetClip(null);
                setPreviewUrl(null);
              }}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/70 hover:bg-black text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Remove media"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Cloudinary AI Auto Caption & Tags Assistant */}
        {previewUrl && postType !== 'story' && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950/50 via-indigo-950/40 to-amber-950/30 border border-purple-500/40 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloudinary AI Vision Assistant</span>
              </span>
              <button
                type="button"
                disabled={isGeneratingCaption}
                onClick={() => handleGenerateAICaption(selectedTone)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-[10px] font-semibold transition-all border border-purple-400/30 cursor-pointer hover:border-purple-300"
                title="Re-run Cloudinary AI Vision analysis"
              >
                <RefreshCw className={`w-3 h-3 text-purple-400 ${isGeneratingCaption ? 'animate-spin' : ''}`} />
                <span>{isGeneratingCaption ? 'Analyzing...' : 'Re-Analyze'}</span>
              </button>
            </div>

            {/* Detected Context & Confidence Badge */}
            {aiContext && (
              <div className="p-2.5 rounded-xl bg-purple-900/40 border border-purple-400/25 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold text-amber-200 truncate">
                      {aiContext.detectedContext}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 font-bold">
                    {aiContext.confidencePercent}% Confidence
                  </span>
                </div>
                <p className="text-[11px] text-white/70 italic leading-snug">
                  {aiContext.aiExplanation}
                </p>
              </div>
            )}

            {/* Tone Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-white/50 mr-1">Select Tone:</span>
              {[
                { id: 'cinematic', label: '🎬 Cinematic' },
                { id: 'viral', label: '🔥 Viral Hook' },
                { id: 'aesthetic', label: '🌿 Aesthetic' },
                { id: 'humor', label: '😂 Relatable' },
              ].map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  disabled={isGeneratingCaption}
                  onClick={() => handleGenerateAICaption(tone.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                    selectedTone === tone.id
                      ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-black border-amber-300 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                  }`}
                >
                  {tone.label}
                </button>
              ))}
            </div>

            {/* Click-to-add AI Tags */}
            {aiContext?.suggestedTagsList && aiContext.suggestedTagsList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-white/5">
                <span className="text-[10px] text-white/50 mr-1">AI Tags:</span>
                {aiContext.suggestedTagsList.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const currentTags = tagsInput
                        ? tagsInput.split(',').map((t) => t.trim().replace(/^#/, ''))
                        : [];
                      if (!currentTags.includes(tag)) {
                        setTagsInput([...currentTags, tag].filter(Boolean).join(', '));
                      }
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-cyan-300 font-mono transition-colors cursor-pointer border border-white/5 hover:border-cyan-400/40"
                    title={`Add #${tag} to post`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Fields */}
        {postType !== 'story' && (
          <>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white/70">Caption & Description</label>
                {caption && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>
              <textarea
                placeholder="Write a caption or click AI Assistant above..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                className="glass-input w-full p-3 text-xs placeholder:text-white/30 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                icon={<MapPin className="w-4 h-4 text-amber-400" />}
                placeholder="Location (e.g. Shibuya, Tokyo)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />

              <GlassInput
                icon={<Tag className="w-4 h-4 text-cyan-400" />}
                placeholder="Tags (e.g. tokyo, neon, cinematics)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            {postType === 'reel' && (
              <GlassInput
                icon={<Music className="w-4 h-4 text-purple-400" />}
                placeholder="Audio track title (e.g. Alex · Tokyo Midnight Synthwave Remix)"
                value={audioTrackTitle}
                onChange={(e) => setAudioTrackTitle(e.target.value)}
              />
            )}
          </>
        )}

        {/* Upload Lifecycle Progress Indicator */}
        {isUploading && (
          <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-300 flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                {uploadStep}
              </span>
              <span className="text-[10px] font-mono text-purple-400 uppercase">Cloudinary</span>
            </div>
            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 w-3/4 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsClipPickerOpen(true)}
            className="text-xs text-purple-300 hover:text-purple-100 flex items-center gap-1.5 cursor-pointer font-semibold"
          >
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Browse Video Reel Library</span>
          </button>

          <div className="flex gap-2">
            <GlassButton
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              variant="primary"
              disabled={!previewUrl || isUploading}
              isLoading={isUploading}
            >
              Share to {postType === 'reel' ? 'Reels' : postType === 'story' ? 'Stories' : 'Feed'}
            </GlassButton>
          </div>
        </div>
      </form>

      {/* Video Reel Clip Picker Modal */}
      {isClipPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-3xl glass border border-purple-500/30 bg-[#0c0a17]/95 rounded-3xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/40">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Select Video Reel Clip</h3>
                  <p className="text-[11px] text-white/50">Curated high-resolution video clips for your reels</p>
                </div>
              </div>

              <button
                onClick={() => setIsClipPickerOpen(false)}
                className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Clips' },
                { id: 'dance', label: '💃 Dance & Rhythm' },
                { id: 'pets', label: '🐱 Cats & Dogs' },
                { id: 'art', label: '🎨 Art & Animation' },
                { id: 'cinematics', label: '🎬 4K Cinematics' },
                { id: 'humor', label: '😂 Relatable Comedy' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setClipCategory(cat.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    clipCategory === cat.id
                      ? 'bg-purple-500 text-white shadow-md font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Clips Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-1">
              {filteredPresetClips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => handleSelectPresetClip(clip)}
                  className="rounded-2xl border border-white/10 hover:border-purple-400 bg-white/[0.03] hover:bg-purple-950/30 p-3 space-y-2 cursor-pointer transition-all group flex flex-col justify-between"
                >
                  {/* Video Preview */}
                  <div className="relative aspect-[9/12] rounded-xl overflow-hidden bg-black/60 border border-white/10">
                    <video
                      src={clip.videoUrl}
                      muted
                      preload="metadata"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">
                      {clip.duration}s
                    </div>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-purple-500/80 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 ml-0.5 fill-white" />
                      </div>
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {clip.title}
                    </p>
                    <p className="text-[10px] text-white/50 line-clamp-1">
                      {clip.audioTrackTitle}
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {clip.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[9px] text-purple-300/80 bg-purple-500/20 px-1.5 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-1.5 rounded-xl bg-purple-500/30 group-hover:bg-purple-500 text-purple-200 group-hover:text-white text-xs font-bold transition-all text-center"
                  >
                    Select Clip
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassModal>
  );
}
