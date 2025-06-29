import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    Recipe;

    // Get the user to check if profile is private
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if current user can see this user's recipes
    const isOwnProfile = user._id.toString() === session.user.id;
    const isFollowing = user.followers?.some((followerId: any) => 
      followerId.toString() === session.user.id
    );

    // If profile is private and user is not following or not own profile, return empty
    if (user.isPrivate && !isFollowing && !isOwnProfile) {
      return NextResponse.json([]);
    }

    // Get recipes created by the user
    const recipes = await Recipe.find({ createdBy: params.id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Get user recipes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}