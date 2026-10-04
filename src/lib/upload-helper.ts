import { MediaAsset } from './types';
import {
  MediaFolderType,
  getOptimizedImageUrl,
  getPlayableVideoUrl,
  getVideoPosterUrl,
} from './cloudinary';

/** Folder types whose uploads become public posts (must be tagged so they can be listed) */
export const POST_FOLDER_TYPES: MediaFolderType[] = ['post_image', 'post_video', 'post_carousel', 'reel'];
export const POST_TAG = 'mediagram_post';

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // Cloudinary free-plan limit
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const SERVER_ROUTE_MAX_BYTES = 4 * 1024 * 1024; // Vercel serverless request body limit is ~4.5MB

/**
 * Extracts a real video thumbnail frame from a local video element
 */
function extractVideoFrame(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(videoUrl);
      return;
    }
    const video = document.createElement('video');
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.currentTime = 0.5;
    video.onloadeddata = () => {
      video.currentTime = 0.5;
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }
      } catch {}
      resolve(videoUrl);
    };
    video.onerror = () => resolve(videoUrl);
    setTimeout(() => resolve(videoUrl), 1200);
  });
}

/** POSTs multipart form data with real upload progress */
function xhrUpload(
  url: string,
  formData: FormData,
  onPercent?: (pct: number) => void
): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onPercent?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && body) resolve(body);
      else reject(new Error(body?.error?.message || body?.error || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading'));
    xhr.ontimeout = () => reject(new Error('Upload timed out'));
    xhr.send(formData);
  });
}

function buildAssetFromCloudinary(params: {
  result: any;
  cloudName: string;
  folder: string;
  userId: string;
  isVideo: boolean;
  tags: string[];
  fallbackBytes: number;
}): MediaAsset {
  const { result, folder, userId, isVideo, tags, fallbackBytes } = params;
  const originalUrl: string = result.secure_url;
  const format: string = result.format || (isVideo ? 'mp4' : 'webp');

  return {
    id: `media_${Date.now()}`,
    userId,
    assetId: result.asset_id || `cld_${Date.now()}`,
    publicId: result.public_id,
    resourceType: isVideo ? 'video' : 'image',
    format,
    width: result.width || 1080,
    height: result.height || (isVideo ? 1920 : 1350),
    duration: result.duration || undefined,
    bytes: result.bytes || fallbackBytes,
    originalUrl,
    // Always a URL every browser can play (non-mp4 containers are transcoded to H.264 MP4)
    optimizedUrl: isVideo
      ? getPlayableVideoUrl(originalUrl, format)
      : getOptimizedImageUrl(originalUrl, { width: 1080, quality: 'auto', format: 'auto' }),
    thumbnailUrl: isVideo
      ? getVideoPosterUrl(originalUrl, { width: 720 })
      : getOptimizedImageUrl(originalUrl, { width: 600, height: 600, crop: 'fill', quality: 'auto' }),
    folder,
    tags,
    createdAt: new Date().toISOString(),
  };
}

export async function uploadMediaFileToCloudinary(params: {
  file: File;
  folderType: MediaFolderType;
  userId: string;
  tags?: string[];
  onProgress?: (status: string) => void;
}): Promise<MediaAsset> {
  const { file, folderType, userId, tags = [], onProgress } = params;

  const fileName = (file.name || '').toLowerCase();
  const isVideo =
    (file.type && file.type.startsWith('video/')) ||
    fileName.endsWith('.mp4') ||
    fileName.endsWith('.webm') ||
    fileName.endsWith('.mov') ||
    fileName.endsWith('.mkv') ||
    fileName.endsWith('.m4v') ||
    folderType === 'reel';

  const resourceType: 'video' | 'image' = isVideo ? 'video' : 'image';
  const isPostUpload = POST_FOLDER_TYPES.includes(folderType);

  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    throw new Error(`Video is too large (${(file.size / 1048576).toFixed(0)}MB). Maximum size is 100MB.`);
  }
  if (!isVideo && file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image is too large (${(file.size / 1048576).toFixed(0)}MB). Maximum size is 10MB.`);
  }

  // Posts carry the public tag so they can be listed for every visitor
  const uploadTags = isPostUpload ? Array.from(new Set([...tags, POST_TAG])) : tags;

  let lastError: unknown = null;

  // Strategy 1: signed direct upload to Cloudinary CDN (fastest; bypasses the 4.5MB serverless limit)
  try {
    onProgress?.('Authorizing secure upload...');
    const signRes = await fetch('/api/media/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderType, tags: uploadTags, resourceType, extraId: userId }),
    });
    const signData = signRes.ok ? await signRes.json() : null;

    if (signData?.signature) {
      const cldFormData = new FormData();
      cldFormData.append('file', file);
      cldFormData.append('api_key', signData.apiKey);
      cldFormData.append('timestamp', String(signData.timestamp));
      cldFormData.append('signature', signData.signature);
      cldFormData.append('folder', signData.folder);
      if (signData.tags) cldFormData.append('tags', signData.tags);

      const uploadUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;
      const result = await xhrUpload(uploadUrl, cldFormData, (pct) =>
        onProgress?.(pct >= 100 ? 'Processing video on Cloudinary...' : `Uploading... ${pct}%`)
      );

      if (result?.secure_url) {
        onProgress?.('Upload complete!');
        return buildAssetFromCloudinary({
          result,
          cloudName: signData.cloudName,
          folder: signData.folder,
          userId,
          isVideo,
          tags,
          fallbackBytes: file.size,
        });
      }
    }
  } catch (err) {
    lastError = err;
    console.warn('Direct Cloudinary upload failed, trying server route:', err);
  }

  // Strategy 2: server upload route (only possible for small files because of serverless body limits)
  if (file.size <= SERVER_ROUTE_MAX_BYTES) {
    try {
      onProgress?.('Uploading via server...');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderType', folderType);
      formData.append('userId', userId);
      if (uploadTags.length > 0) formData.append('tags', uploadTags.join(','));

      const data = await xhrUpload('/api/media/upload', formData);
      if (data?.media && !String(data.media.assetId).startsWith('local_')) {
        onProgress?.('Upload complete!');
        return data.media as MediaAsset;
      }
    } catch (err) {
      lastError = err;
      console.warn('Server upload route failed:', err);
    }
  }

  // Posts must live on Cloudinary, otherwise they would break after a reload and nobody else could see them.
  if (isPostUpload) {
    const reason = lastError instanceof Error ? lastError.message : 'Cloudinary rejected the upload';
    throw new Error(`Could not upload your ${isVideo ? 'video' : 'photo'}: ${reason}`);
  }

  // Strategy 3 (messages / stories only): local preview so the user is never blocked
  onProgress?.('Finalizing media...');
  const localUrl = URL.createObjectURL(file);
  let thumbnail = localUrl;
  if (isVideo) {
    try {
      thumbnail = await extractVideoFrame(localUrl);
    } catch {
      thumbnail = localUrl;
    }
  }

  return {
    id: `media_${Date.now()}`,
    userId,
    assetId: `local_${Date.now()}`,
    publicId: `mediagram/local/${Date.now()}`,
    resourceType,
    format: isVideo ? 'mp4' : 'jpeg',
    width: 1080,
    height: isVideo ? 1920 : 1350,
    bytes: file.size,
    originalUrl: localUrl,
    thumbnailUrl: thumbnail,
    optimizedUrl: localUrl,
    folder: `mediagram/users/${userId}/${folderType}`,
    tags,
    createdAt: new Date().toISOString(),
  };
}
