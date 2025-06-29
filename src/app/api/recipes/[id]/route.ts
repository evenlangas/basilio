import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import User from '@/models/User';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    Recipe;

    // For viewing recipes, be more permissive - allow viewing any recipe for now
    // Later we can add more sophisticated access control based on cookbook privacy, etc.
    const query = { _id: id };

    const recipe = await Recipe.findOne(query)
      .populate('createdBy', 'name')
      .populate('originalChef', 'name')
      .populate('copiedBy', 'name')
      .populate('originalRecipe', 'title');

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = await params;
    
    await dbConnect();
    Recipe;

    // Find the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow editing recipes created by the current user
    const updateQuery = { _id: id, createdBy: user._id };

    const recipe = await Recipe.findOneAndUpdate(
      updateQuery,
      data,
      { new: true }
    ).populate('createdBy', 'name')
     .populate('originalChef', 'name')
     .populate('copiedBy', 'name')
     .populate('originalRecipe', 'title');

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    Recipe;

    // Find the current user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only allow deleting recipes created by the current user
    const deleteQuery = { _id: id, createdBy: user._id };

    const recipe = await Recipe.findOneAndDelete(deleteQuery);

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}