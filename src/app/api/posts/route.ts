import { NextRequest, NextResponse } from 'next/server';
import { cloudinary } from '@/lib/cloudinary-server';
import { getOptimizedImageUrl, getPlayableVideoUrl, getVideoPosterUrl } from '@/lib/cloudinary';
import type { MediaAsset, Post } from '@/lib/types';

/**
 * Public, shared post storage backed by Cloudinary.
 *
 * Every published post is a Cloudinary asset tagged `mediagram_post` whose metadata
 * (caption, author, location, tags...) lives in the asset's `context`. That means:
 *   - uploaded media + its post data are stored permanently in the cloud
 *   - every visitor on every device sees the same posts (fully public)
 *   - the owner can edit (context update) or delete (asset destroy) their own posts
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const POST_TAG = 'mediagram_post';
const USER_FOLDER_PREFIX = 'mediagram/users/';

type ResourceType = 'image' | 'video';

function clamp(value: unknown, max: number): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function sanitizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((t) => String(t).replace(/[#,|=]/g, '').trim())
    .filter(Boolean)
    .slice(0, 15);
}

function isValidResourceType(v: unknown): v is ResourceType {
  return v === 'image' || v === 'video';
}

function errorStatus(err: any): number {
  return err?.http_code && Number.isInteger(err.http_code) ? err.http_code : 500;
}

function resourceToPost(r: any, resourceType: ResourceType): Post | null {
  const ctx = r?.context?.custom;
  if (!ctx || !ctx.pid || !ctx.uid) return null;

  const isVideo = resourceType === 'video';
  const secureUrl: string = r.secure_url;
  const createdAt: string = ctx.ts || r.created_at || new Date().toISOString();

  const media: MediaAsset = {
    id: `media_${r.asset_id || r.public_id}`,
    userId: ctx.uid,
    postId: ctx.pid,
    assetId: r.asset_id || r.public_id,
    publicId: r.public_id,
    resourceType,
    format: r.format || (isVideo ? 'mp4' : 'jpg'),
    width: r.width || 1080,
    height: r.height || (isVideo ? 1920 : 1350),
    duration: r.duration || undefined,
    bytes: r.bytes || 0,
    originalUrl: secureUrl,
    optimizedUrl: isVideo
      ? getPlayableVideoUrl(secureUrl, r.format)
      : getOptimizedImageUrl(secureUrl, { width: 1080, quality: 'auto', format: 'auto' }),
    thumbnailUrl: isVideo
      ? getVideoPosterUrl(secureUrl, { width: 720 })
      : getOptimizedImageUrl(secureUrl, { width: 600, height: 600, crop: 'fill', quality: 'auto' }),
    folder: r.folder || r.asset_folder,
    tags: ctx.tg ? String(ctx.tg).split(',').filter(Boolean) : [],
    createdAt,
  };

  const tags = media.tags || [];

  return {
    id: ctx.pid,
    userId: ctx.uid,
    user: {
      id: ctx.uid,
      username: ctx.un || 'user',
      name: ctx.nm || ctx.un || 'User',
      avatarUrl: ctx.av || undefined,
      isVerified: ctx.vf === '1',
    },
    caption: ctx.cap || '',
    location: ctx.loc || undefined,
    visibility: 'public',
    media: [media],
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    isLiked: false,
    isBookmarked: false,
    comments: [],
    tags,
    isReel: isVideo,
    createdAt,
  };
}

async function listByType(resourceType: ResourceType): Promise<{ posts: Post[]; full: boolean }> {
  const res: any = await cloudinary.api.resources_by_tag(POST_TAG, {
    resource_type: resourceType,
    context: true,
    max_results: 100,
    direction: 'desc',
  });
  const out: Post[] = [];
  for (const r of res?.resources || []) {
    const post = resourceToPost(r, resourceType);
    if (post) out.push(post);
  }
  return { posts: out, full: (res?.resources?.length || 0) >= 100 || !!res?.next_cursor };
}

/** GET /api/posts  -> all public posts, newest first */
export async function GET() {
  try {
    const empty = { posts: [] as Post[], full: true }; // a failed list call counts as "incomplete"
    const [images, videos] = await Promise.all([
      listByType('image').catch(() => empty),
      listByType('video').catch(() => empty),
    ]);
    const posts = [...images.posts, ...videos.posts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return NextResponse.json(
      { success: true, posts, truncated: images.full || videos.full },
      {
        headers: {
          // Short CDN cache keeps the Cloudinary Admin API well under its hourly rate limit
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        },
      }
    );
  } catch (err: any) {
    console.error('List posts failed:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to list posts', posts: [] }, { status: 200 });
  }
}

/** POST /api/posts -> publish an uploaded asset as a public post */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId, resourceType, postId, user } = body || {};

    if (!publicId || !isValidResourceType(resourceType) || !postId || !user?.id) {
      return NextResponse.json({ error: 'Missing publicId, resourceType, postId or user' }, { status: 400 });
    }
    if (typeof publicId !== 'string' || !publicId.startsWith(USER_FOLDER_PREFIX)) {
      return NextResponse.json({ error: 'Invalid asset' }, { status: 400 });
    }

    const avatar = typeof user.avatarUrl === 'string' && user.avatarUrl.length < 800 ? user.avatarUrl : '';
    const context: Record<string, string> = {
      pid: clamp(postId, 80),
      uid: clamp(user.id, 80),
      un: clamp(user.username, 60),
      nm: clamp(user.name, 80),
      av: avatar,
      vf: user.isVerified ? '1' : '0',
      cap: clamp(body.caption, 600) || ' ',
      loc: clamp(body.location, 120),
      tg: sanitizeTags(body.tags).join(','),
      aud: clamp(body.audioTrackTitle, 120),
      ts: new Date().toISOString(),
    };

    await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      resource_type: resourceType,
      context,
    });
    // Ensure the post tag is present even if the client skipped it
    await cloudinary.uploader.add_tag(POST_TAG, [publicId], { resource_type: resourceType }).catch(() => null);

    return NextResponse.json({ success: true, postId: context.pid });
  } catch (err: any) {
    console.error('Publish post failed:', err);
    return NextResponse.json({ error: err?.message || 'Failed to publish post' }, { status: errorStatus(err) });
  }
}

async function assertOwner(publicId: string, resourceType: ResourceType, userId: string) {
  if (!publicId.startsWith(USER_FOLDER_PREFIX)) {
    const e: any = new Error('This media cannot be modified');
    e.http_code = 403;
    throw e;
  }
  const res: any = await cloudinary.api.resource(publicId, { resource_type: resourceType, context: true });
  const ownerId = res?.context?.custom?.uid;
  if (!ownerId || ownerId !== userId) {
    const e: any = new Error('You can only modify your own posts');
    e.http_code = 403;
    throw e;
  }
  return res;
}

/** PATCH /api/posts -> owner edits caption / location / tags */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId, resourceType, userId } = body || {};
    if (!publicId || !isValidResourceType(resourceType) || !userId) {
      return NextResponse.json({ error: 'Missing publicId, resourceType or userId' }, { status: 400 });
    }

    const current = await assertOwner(publicId, resourceType, userId);
    const existing = current?.context?.custom || {};

    const context: Record<string, string> = {
      ...existing,
      cap: body.caption !== undefined ? clamp(body.caption, 600) || ' ' : existing.cap || ' ',
      loc: body.location !== undefined ? clamp(body.location, 120) : existing.loc || '',
      tg: body.tags !== undefined ? sanitizeTags(body.tags).join(',') : existing.tg || '',
    };

    await cloudinary.uploader.explicit(publicId, { type: 'upload', resource_type: resourceType, context });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Edit post failed:', err);
    return NextResponse.json({ error: err?.message || 'Failed to edit post' }, { status: errorStatus(err) });
  }
}

/** DELETE /api/posts -> owner deletes post + media from Cloudinary */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { publicId, resourceType, userId } = body || {};
    if (!publicId || !isValidResourceType(resourceType) || !userId) {
      return NextResponse.json({ error: 'Missing publicId, resourceType or userId' }, { status: 400 });
    }

    await assertOwner(publicId, resourceType, userId);
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete post failed:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete post' }, { status: errorStatus(err) });
  }
}
