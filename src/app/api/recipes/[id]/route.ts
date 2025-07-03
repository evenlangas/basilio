import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import User from '@/models/User';
import Cookbook from '@/models/Cookbook';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    Recipe;

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recipe = await Recipe.findById(id)
      .populate('createdBy', 'name image')
      .populate('originalChef', 'name image')
      .populate('copiedBy', 'name image')
      .populate('originalRecipe', 'title')
      .populate({
        path: 'ratings.user',
        select: 'name image'
      })
      .populate({
        path: 'ratings.creation',
        select: 'title'
      });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Privacy check: only allow access to public recipes or recipes owned by user
    if (recipe.isPrivate && !recipe.createdBy._id.equals(user._id)) {
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

    // Get current recipe to check constraints
    const currentRecipe = await Recipe.findOne({ _id: id, createdBy: user._id });
    
    if (!currentRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // If recipe is in a cookbook, validate privacy settings
    if (currentRecipe.cookbookId && data.isPrivate !== undefined) {
      const cookbook = await Cookbook.findById(currentRecipe.cookbookId);
      if (cookbook && !cookbook.isPrivate && data.isPrivate) {
        return NextResponse.json({ 
          error: 'Cannot make recipe private while it\'s in a public cookbook. Remove it from the cookbook first.' 
        }, { status: 400 });
      }
    }

    const recipe = await Recipe.findOneAndUpdate(
      { _id: id, createdBy: user._id },
      data,
      { new: true }
    ).populate('createdBy', 'name image')
     .populate('originalChef', 'name image')
     .populate('copiedBy', 'name image')
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