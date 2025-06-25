import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import User from '@/models/User';
import Recipe from '@/models/Recipe';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get creations from users this user follows AND the user's own creations
    const followingIds = user.following || [];
    const allUserIds = [user._id, ...followingIds];

    const creations = await Creation.find({ 
      createdBy: { $in: allUserIds } 
    })
    .populate('createdBy', 'name image')
    .populate('recipe', 'title')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to recent 50 creations

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}