import { v2 as cloudinary } from 'cloudinary';
import { CLOUD_NAME, getFolderPath, MediaFolderType } from './cloudinary';

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function getCloudinaryCredentials() {
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUD_NAME || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  return { apiKey, apiSecret };
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

  const { apiKey, apiSecret } = getCloudinaryCredentials();

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
