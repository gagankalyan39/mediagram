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
 * Generate Video Thumbnail / Poster directly from Cloudinary for that exact video
 */
export function getVideoPosterUrl(publicIdOrUrl: string, options?: {
  width?: number;
  height?: number;
  offsetSeconds?: number;
}): string {
  if (!publicIdOrUrl) return '';
  const width = options?.width ? `w_${options.width},` : 'w_720,';
  const height = options?.height ? `h_${options.height},` : '';
  const so = options?.offsetSeconds !== undefined ? `so_${options.offsetSeconds},` : 'so_1,';

  // If already a Cloudinary delivery URL
  if (publicIdOrUrl.includes('/video/upload/')) {
    return publicIdOrUrl
      .replace('/video/upload/', `/video/upload/${width}${height}${so}c_fill,f_jpg,q_auto/`)
      .replace(/\.[^/.]+$/, '.jpg');
  }

  // If it's a local video path e.g. '/videos/reel_01.mp4' or 'reel_01.mp4'
  const match = publicIdOrUrl.match(/reel_(\d+)/i);
  if (match) {
    const num = match[1].padStart(2, '0');
    return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${width}${height}${so}c_fill,f_jpg,q_auto/mediagram/reels/reel_${num}.jpg`;
  }

  const cleanId = publicIdOrUrl.replace(/\.[^/.]+$/, '').replace(/^\//, '');
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/${width}${height}${so}c_fill,f_jpg,q_auto/${cleanId}.jpg`;
}

export const getCloudinaryVideoThumbnail = getVideoPosterUrl;

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
