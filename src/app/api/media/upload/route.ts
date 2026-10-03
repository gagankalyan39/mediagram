import { NextRequest, NextResponse } from 'next/server';
import { cloudinary, getFolderPath, MediaFolderType, getOptimizedImageUrl, getVideoPosterUrl, getOptimizedVideoUrl } from '@/lib/cloudinary';

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

    // Determine resource type
    const isVideo = file.type.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    // Upload directly to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
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

    const publicId = uploadResult.public_id;
    const format = uploadResult.format || (isVideo ? 'mp4' : 'webp');

    // Generate responsive delivery URLs
    const originalUrl = uploadResult.secure_url;
    const optimizedUrl = isVideo
      ? getOptimizedVideoUrl(publicId)
      : getOptimizedImageUrl(publicId, { quality: 'auto', format: 'auto' });
    const thumbnailUrl = isVideo
      ? getVideoPosterUrl(publicId, { width: 720 })
      : getOptimizedImageUrl(publicId, { width: 600, height: 600, crop: 'fill', quality: 'auto' });

    return NextResponse.json({
      success: true,
      media: {
        id: `media_${Date.now()}`,
        userId,
        assetId: uploadResult.asset_id,
        publicId,
        resourceType,
        format,
        width: uploadResult.width || 1080,
        height: uploadResult.height || 1350,
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
  } catch (error: any) {
    console.error('Cloudinary live upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload to Cloudinary failed' },
      { status: 500 }
    );
  }
}
