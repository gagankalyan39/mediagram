import { v2 as cloudinary } from 'cloudinary';
import { CLOUD_NAME, getFolderPath, MediaFolderType } from './cloudinary';

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'rwcuzbxd',
  api_key: process.env.CLOUDINARY_API_KEY || '945753893851776',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ukRzmGJZq5AGP4b4u7xUKkPITUc',
  secure: true,
});

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

export { cloudinary };
