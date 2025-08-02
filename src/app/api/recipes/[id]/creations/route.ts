import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
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
    
    // Ensure models are registered
    Recipe;
    Creation;
    
    // Check if recipe exists
    const recipe = await Recipe.findById(params.id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Get all creations that use this recipe
    const creations = await Creation.find({ 
      recipe: params.id 
    })
    .populate('createdBy', 'name image')
    .populate('chef', 'name image') // Populate new chef field
    .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
    .populate('recipe', 'title')
    .sort({ createdAt: -1 });

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching recipe creations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}