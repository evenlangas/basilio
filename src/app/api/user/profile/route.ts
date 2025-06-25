import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email })
      .populate('followers', 'name image')
      .populate('following', 'name image');
      
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize stats if they don't exist
    if (!user.stats) {
      user.stats = {
        recipesCreated: 0,
        creationsPosted: 0,
        cookingHours: 0,
        onionsCut: 0,
      };
      await user.save();
    }

    // Initialize other fields if they don't exist
    if (!user.bio) user.bio = '';
    if (user.isPrivate === undefined) user.isPrivate = false;
    if (!user.followers) user.followers = [];
    if (!user.following) user.following = [];
    if (!user.trophies) user.trophies = [];
    if (user.hasBasilioPlus === undefined) user.hasBasilioPlus = false;

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, isPrivate } = body;

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update profile fields
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (isPrivate !== undefined) user.isPrivate = isPrivate;

    await user.save();

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}