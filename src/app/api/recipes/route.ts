import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import Cookbook from '@/models/Cookbook';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    Recipe;

    // Only show recipes created by the current user (my recipes)
    const recipes = await Recipe.find({ createdBy: session.user.id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cookbook, ...recipeData } = await request.json();
    
    await dbConnect();
    Recipe;

    // Validate privacy setting against cookbook
    if (cookbook) {
      const selectedCookbook = await Cookbook.findById(cookbook);
      if (!selectedCookbook) {
        return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
      }
      
      // Check if recipe privacy is compatible with cookbook privacy
      if (recipeData.isPrivate && !selectedCookbook.isPrivate) {
        return NextResponse.json({ 
          error: 'Cannot add private recipe to public cookbook. Make the recipe public first.' 
        }, { status: 400 });
      }
    }

    const recipe = await Recipe.create({
      ...recipeData,
      createdBy: session.user.id,
      cookbookId: cookbook || null,
    });

    // If a cookbook was selected, add the recipe to it
    if (cookbook) {
      await Cookbook.findByIdAndUpdate(
        cookbook,
        { $push: { recipes: recipe._id } }
      );
    }

    const populatedRecipe = await Recipe.findById(recipe._id).populate('createdBy', 'name');

    return NextResponse.json(populatedRecipe, { status: 201 });
  } catch (error) {
    console.error('Create recipe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}