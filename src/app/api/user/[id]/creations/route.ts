import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
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

    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check privacy settings
    const isOwnProfile = targetUser._id.toString() === currentUser._id.toString();
    const isFollowing = targetUser.followers?.includes(currentUser._id);
    
    if (targetUser.isPrivate && !isOwnProfile && !isFollowing) {
      return NextResponse.json([]);
    }

    // Get creations from this user
    const creations = await Creation.find({ createdBy: params.id })
      .populate('createdBy', 'name image')
      .populate('likes', 'name image')
      .populate('chef', 'name image') // Populate new chef field
      .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
      .populate('recipes.recipe', 'title')
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching user creations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}