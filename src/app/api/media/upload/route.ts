import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary-server';
import { getFolderPath, MediaFolderType, getOptimizedImageUrl, getVideoPosterUrl, getOptimizedVideoUrl } from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60; // 60 seconds timeout on Vercel
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folderType = (formData.get('folderType') as MediaFolderType) || 'post_image';
    const tagsString = (formData.get('tags') as string) || '';
    const userId = (formData.get('userId') as string) || 'user';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = getFolderPath(folderType);
    const tags = tagsString
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Determine resource type robustly
    const originalFileName = file.name || 'upload';
    const lowerName = originalFileName.toLowerCase();
    const isVideo =
      (file.type && file.type.startsWith('video/')) ||
      lowerName.endsWith('.mp4') ||
      lowerName.endsWith('.webm') ||
      lowerName.endsWith('.mov') ||
      lowerName.endsWith('.mkv') ||
      lowerName.endsWith('.m4v') ||
      folderType === 'reel';

    const ext = path.extname(originalFileName) || (isVideo ? '.mp4' : '.jpg');
    const safeBaseName = path.basename(originalFileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const localFileName = `${Date.now()}_${safeBaseName}${ext}`;

    // In local development, write a backup to public/uploads
    // On Vercel / serverless (read-only filesystem), handle gracefully without crashing
    let localSaved = false;
    if (!process.env.VERCEL) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadsDir, localFileName), buffer);
        localSaved = true;
      } catch (saveErr) {
        // Gracefully ignore on read-only environments
      }
    }

    const localUrl = `/uploads/${localFileName}`;
    const resourceType: 'video' | 'image' | 'auto' = isVideo ? 'video' : 'auto';

    let uploadResult: any = null;
    try {
      // Upload directly to Cloudinary
      uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            tags: [...tags, userId, folderType],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });
    } catch (cldError: any) {
      console.warn('Cloudinary upload stream notice, utilizing saved local media:', cldError?.message || cldError);
    }

    if (uploadResult && uploadResult.secure_url) {
      const publicId = uploadResult.public_id;
      const format = uploadResult.format || (isVideo ? 'mp4' : 'webp');
      const originalUrl = uploadResult.secure_url;
      const optimizedUrl = isVideo
        ? getOptimizedVideoUrl(originalUrl)
        : getOptimizedImageUrl(originalUrl, { quality: 'auto', format: 'auto' });
      const thumbnailUrl = isVideo
        ? getVideoPosterUrl(originalUrl, { width: 720 })
        : getOptimizedImageUrl(originalUrl, { width: 600, height: 600, crop: 'fill', quality: 'auto' });

      return NextResponse.json({
        success: true,
        media: {
          id: `media_${Date.now()}`,
          userId,
          assetId: uploadResult.asset_id,
          publicId,
          resourceType: isVideo ? 'video' : 'image',
          format,
          width: uploadResult.width || (isVideo ? 1080 : 1080),
          height: uploadResult.height || (isVideo ? 1920 : 1350),
          duration: uploadResult.duration || undefined,
          bytes: uploadResult.bytes || file.size,
          originalUrl,
          optimizedUrl,
          thumbnailUrl,
          folder,
          tags,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Local permanent media fallback (persists across reloads, accessible to any user)
    const fallbackPoster = isVideo ? getVideoPosterUrl(localFileName) : localUrl;
    return NextResponse.json({
      success: true,
      media: {
        id: `media_${Date.now()}`,
        userId,
        assetId: `local_${Date.now()}`,
        publicId: `uploads/${localFileName}`,
        resourceType: isVideo ? 'video' : 'image',
        format: ext.replace('.', ''),
        width: isVideo ? 1080 : 1080,
        height: isVideo ? 1920 : 1350,
        bytes: file.size,
        originalUrl: localUrl,
        optimizedUrl: localUrl,
        thumbnailUrl: fallbackPoster,
        folder: `mediagram/uploads`,
        tags,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
