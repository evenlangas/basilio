import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { put } from '@vercel/blob';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `recipe-${session.user.id}-${timestamp}.webp`;

    // Process and optimize image with Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize(800, 600, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .webp({ quality: 85 })
      .toBuffer();

    // Upload to Vercel Blob
    const blob = await put(fileName, optimizedBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });

    return NextResponse.json({ 
      imageUrl: blob.url,
      message: 'Image uploaded successfully' 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}