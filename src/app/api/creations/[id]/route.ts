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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const creation = await Creation.findById(params.id);
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user owns this creation
    if (creation.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized - can only edit your own creations' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, image, recipe, eatenWith, cookingTime, drankWith, chefName } = body;

    // Update the creation
    const updatedCreation = await Creation.findByIdAndUpdate(
      params.id,
      {
        title,
        description,
        image,
        recipe: recipe || null,
        eatenWith,
        cookingTime,
        drankWith,
        chefName
      },
      { new: true }
    ).populate('createdBy', 'name image')
     .populate('likes', 'name image')
     .populate({
       path: 'recipe',
       select: 'title description cookingTime servings image ingredients instructions'
     });

    return NextResponse.json(updatedCreation);
  } catch (error) {
    console.error('Error updating creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const creation = await Creation.findById(params.id);
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user owns this creation
    if (creation.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Unauthorized - can only delete your own creations' }, { status: 403 });
    }

    await Creation.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Creation deleted successfully' });
  } catch (error) {
    console.error('Error deleting creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}