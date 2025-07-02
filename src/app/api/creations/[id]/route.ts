import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import User from '@/models/User';
import Recipe from '@/models/Recipe';

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
    Recipe;
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creation = await Creation.findById(params.id)
      .populate('createdBy', 'name image')
      .populate('likes', 'name image')
      .populate({
        path: 'recipe',
        select: 'title description cookingTime servings image ingredients instructions'
      });

    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user has permission to view this creation
    // (For now, all authenticated users can view all creations)
    // TODO: Add privacy controls if needed

    return NextResponse.json(creation);
  } catch (error) {
    console.error('Error fetching creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}