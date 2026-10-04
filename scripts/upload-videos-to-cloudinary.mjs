/**
 * Upload all local reel videos to Cloudinary and output updated video-library.ts URLs
 * Run: node scripts/upload-videos-to-cloudinary.mjs
 */

import { v2 as cloudinary } from 'cloudinary';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'videos');

cloudinary.config({
  cloud_name: 'rwcuzbxd',
  api_key: '945753893851776',
  api_secret: 'ukRzmGJZq5AGP4b4u7xUKkPITUc',
  secure: true,
});

const REELS = Array.from({ length: 33 }, (_, i) => {
  const n = String(i + 1).padStart(2, '0');
  return {
    filename: `reel_${n}.mp4`,
    publicId: `mediagram/reels/reel_${n}`,
  };
});

async function uploadVideo(filename, publicId) {
  const filePath = path.join(PUBLIC_DIR, filename);
  if (!existsSync(filePath)) {
    console.warn(`  ⚠️  File not found: ${filePath}`);
    return null;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: 'video',
        overwrite: false, // skip if already uploaded
        invalidate: false,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    createReadStream(filePath).pipe(stream);
  });
}

async function main() {
  console.log(`\n🚀 Uploading ${REELS.length} reels to Cloudinary (cloud: rwcuzbxd)\n`);
  const results = [];

  for (const reel of REELS) {
    process.stdout.write(`  Uploading ${reel.filename}...`);
    try {
      const res = await uploadVideo(reel.filename, reel.publicId);
      if (res) {
        const url = res.secure_url;
        console.log(` ✅  ${url}`);
        results.push({ filename: reel.filename, url });
      } else {
        // Build expected URL anyway even if file missing
        const url = `https://res.cloudinary.com/rwcuzbxd/video/upload/${reel.publicId}.mp4`;
        console.log(` ⚠️  (file missing, using expected URL)`);
        results.push({ filename: reel.filename, url });
      }
    } catch (err) {
      if (err?.error?.http_code === 409 || (err?.message || '').includes('already exists')) {
        const url = `https://res.cloudinary.com/rwcuzbxd/video/upload/${reel.publicId}.mp4`;
        console.log(` ✅  already exists → ${url}`);
        results.push({ filename: reel.filename, url });
      } else {
        console.error(` ❌  ${err?.message || err}`);
        results.push({ filename: reel.filename, url: null, error: err?.message });
      }
    }
  }

  console.log('\n\n📋 Cloudinary URLs Map:\n');
  const map = {};
  for (const r of results) {
    if (r.url) map[r.filename] = r.url;
  }
  console.log(JSON.stringify(map, null, 2));

  // Also print the full updated PRESET_VIDEO_CLIPS array snippet for easy copy-paste
  console.log('\n\n✅ Done! Copy the JSON above into your update script or use the URLs in video-library.ts\n');
}

main().catch(console.error);
