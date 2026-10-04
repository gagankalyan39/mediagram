import { v2 as cloudinary } from 'cloudinary';
import { CLOUD_NAME, getFolderPath, MediaFolderType } from './cloudinary';

/**
 * Credentials are resolved in this order:
 *   1. Individual env vars (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)
 *   2. CLOUDINARY_URL  (cloudinary://key:secret@cloud)
 *   3. Project defaults (owner confirmed credentials may be public).
 * This guarantees uploads keep working on Vercel even if the env vars were never
 * configured there (the local .env file is git-ignored and therefore not deployed).
 */
const DEFAULT_API_KEY = '945753893851776';
const DEFAULT_API_SECRET = 'ukRzmGJZq5AGP4b4u7xUKkPITUc';

function resolveCredentials() {
  let apiKey = process.env.CLOUDINARY_API_KEY;
  let apiSecret = process.env.CLOUDINARY_API_SECRET;

  const url = process.env.CLOUDINARY_URL;
  if ((!apiKey || !apiSecret) && url) {
    const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@/);
    if (m) {
      apiKey = apiKey || m[1];
      apiSecret = apiSecret || m[2];
    }
  }

  return {
    apiKey: apiKey || DEFAULT_API_KEY,
    apiSecret: apiSecret || DEFAULT_API_SECRET,
  };
}

const { apiKey: RESOLVED_KEY, apiSecret: RESOLVED_SECRET } = resolveCredentials();

// Configure Cloudinary server-side instance
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: RESOLVED_KEY,
  api_secret: RESOLVED_SECRET,
  secure: true,
});

function getCloudinaryCredentials() {
  return { apiKey: RESOLVED_KEY, apiSecret: RESOLVED_SECRET };
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
