import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'rwcuzbxd',
  api_key: process.env.CLOUDINARY_API_KEY || '945753893851776',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ukRzmGJZq5AGP4b4u7xUKkPITUc',
  secure: true,
});

export const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'rwcuzbxd';

export type MediaFolderType = 
  | 'user_profile'
  | 'user_cover'
  | 'post_image'
  | 'post_video'
  | 'post_carousel'
  | 'story'
  | 'reel'
  | 'message';

/**
 * Returns canonical folder path per product architecture specification
 */
export function getFolderPath(folderType: MediaFolderType, extraId?: string): string {
  const baseFolder = extraId ? `mediagram/users/${extraId}` : 'mediagram/general';
  
  switch (folderType) {
    case 'user_profile':
      return `${baseFolder}/profile`;
    case 'user_cover':
      return `${baseFolder}/cover`;
    case 'post_image':
      return `${baseFolder}/posts/images`;
    case 'post_video':
      return `${baseFolder}/posts/videos`;
    case 'post_carousel':
      return `${baseFolder}/posts/carousels`;
    case 'story':
      return `${baseFolder}/stories`;
    case 'reel':
      return `${baseFolder}/reels`;
    case 'message':
      return `${baseFolder}/messages`;
    default:
      return baseFolder;
  }
}

/**
 * Generate signed upload parameters for secure frontend direct upload
 * Avoids leaking Cloudinary API Secret to the browser.
 */
export function generateUploadSignature(options: {
  folderType: MediaFolderType;
  customPublicId?: string;
  extraId?: string;
  tags?: string[];
  resourceType?: 'image' | 'video' | 'auto';
}) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = getFolderPath(options.folderType, options.extraId);

  const paramsToSign: Record<string, string | number> = {
    folder,
    timestamp,
  };

  if (options.customPublicId) {
    paramsToSign.public_id = options.customPublicId;
  }

  if (options.tags && options.tags.length > 0) {
    paramsToSign.tags = options.tags.join(',');
  }

  const apiSecret = process.env.CLOUDINARY_API_SECRET || 'ukRzmGJZq5AGP4b4u7xUKkPITUc';
  const apiKey = process.env.CLOUDINARY_API_KEY || '945753893851776';

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

  return {
    signature,
    timestamp,
    apiKey,
    cloudName: CLOUD_NAME,
    folder,
    publicId: options.customPublicId,
    tags: options.tags?.join(','),
  };
}

/**
 * Generate responsive and optimized Cloudinary URLs
 * Adheres to: Feed -> Container size -> Cloudinary transformation -> q_auto + f_auto -> CDN
 */
export function getOptimizedImageUrl(publicIdOrUrl: string, options?: {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale';
  quality?: string | number;
  format?: string;
  blur?: number;
}): string {
  if (!publicIdOrUrl) return '';
  // If it's already a full external non-cloudinary url
  if (publicIdOrUrl.startsWith('http') && !publicIdOrUrl.includes('res.cloudinary.com')) {
    return publicIdOrUrl;
  }

  const width = options?.width ? `w_${options.width}` : '';
  const height = options?.height ? `h_${options.height}` : '';
  const crop = options?.crop ? `c_${options.crop}` : 'c_fill';
  const quality = options?.quality ? `q_${options.quality}` : 'q_auto';
  const format = options?.format ? `f_${options.format}` : 'f_auto';
  const blur = options?.blur ? `e_blur:${options.blur}` : '';

  const transforms = [crop, quality, format, width, height, blur].filter(Boolean).join(',');

  // If already a Cloudinary delivery URL, inject transforms
  if (publicIdOrUrl.includes('/upload/')) {
    return publicIdOrUrl.replace('/upload/', `/upload/${transforms}/`);
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicIdOrUrl}`;
}

/**
 * Generate Video Thumbnail / Poster
 */
export function getVideoPosterUrl(publicIdOrUrl: string, options?: {
  width?: number;
  height?: number;
}): string {
  if (!publicIdOrUrl) return '';
  const width = options?.width ? `w_${options.width},` : 'w_720,';
  const height = options?.height ? `h_${options.height},` : '';

  if (publicIdOrUrl.includes('/video/upload/')) {
    return publicIdOrUrl
      .replace('/video/upload/', `/video/upload/${width}${height}c_fill,so_0,f_jpg,q_auto/`)
      .replace(/\.[^/.]+$/, '.jpg');
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${width}${height}c_fill,so_0,f_jpg,q_auto/${publicIdOrUrl}.jpg`;
}

/**
 * Optimized Video Delivery (adaptive format, auto quality)
 */
export function getOptimizedVideoUrl(publicIdOrUrl: string, options?: {
  width?: number;
  quality?: string;
}): string {
  if (!publicIdOrUrl) return '';
  const width = options?.width ? `w_${options.width},` : '';
  const quality = options?.quality ? `q_${options.quality},` : 'q_auto,';
  const transforms = `${width}${quality}vc_auto`;

  if (publicIdOrUrl.includes('/video/upload/')) {
    return publicIdOrUrl.replace('/video/upload/', `/video/upload/${transforms}/`);
  }

  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${transforms}/${publicIdOrUrl}`;
}

export { cloudinary };
