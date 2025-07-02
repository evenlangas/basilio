import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.formData();
    const file: File | null = data.get('image') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `creation-${session.user.id}-${timestamp}.${fileExtension}`;

    // Upload to Vercel Blob Storage
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({ imageUrl: blob.url });
  } catch (error) {
    console.error('Error uploading creation image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}