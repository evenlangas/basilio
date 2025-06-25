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

    let query: any;
    
    if (session.user.familyId) {
      // If user is part of a family, show all family recipes
      query = { familyId: session.user.familyId };
    } else {
      // If user has no family, show only their personal recipes
      query = { createdBy: session.user.id, familyId: null };
    }

    const recipes = await Recipe.find(query).populate('createdBy', 'name').sort({ createdAt: -1 });

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

    const recipe = await Recipe.create({
      ...recipeData,
      createdBy: session.user.id,
      familyId: session.user.familyId || null,
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