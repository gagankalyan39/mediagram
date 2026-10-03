import { NextRequest, NextResponse } from 'next/server';
import { generateUploadSignature, MediaFolderType } from '@/lib/cloudinary';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const folderType = (body.folderType as MediaFolderType) || 'post_image';
    const tags = Array.isArray(body.tags) ? body.tags : [];
    const extraId = body.extraId;
    const customPublicId = body.customPublicId;

    const signatureData = generateUploadSignature({
      folderType,
      tags,
      extraId,
      customPublicId,
    });

    return NextResponse.json({
      success: true,
      ...signatureData,
    });
  } catch (error: any) {
    console.error('Error generating Cloudinary upload signature:', error);
    return NextResponse.json(
      { error: error.message || 'Signature generation failed' },
      { status: 500 }
    );
  }
}
