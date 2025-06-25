import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    const targetUser = await User.findById(params.id)
      .populate('followers', 'name image')
      .populate('following', 'name image');
      
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Initialize fields if they don't exist
    if (!targetUser.stats) {
      targetUser.stats = {
        recipesCreated: 0,
        creationsPosted: 0,
        cookingHours: 0,
        onionsCut: 0,
      };
      await targetUser.save();
    }

    if (!targetUser.bio) targetUser.bio = '';
    if (targetUser.isPrivate === undefined) targetUser.isPrivate = false;
    if (!targetUser.followers) targetUser.followers = [];
    if (!targetUser.following) targetUser.following = [];
    if (!targetUser.trophies) targetUser.trophies = [];
    if (targetUser.hasBasilioPlus === undefined) targetUser.hasBasilioPlus = false;

    // Don't expose email unless it's the user's own profile
    const isOwnProfile = targetUser._id.toString() === currentUser._id.toString();
    const userProfile = targetUser.toObject();
    
    if (!isOwnProfile) {
      delete userProfile.email;
    }

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}