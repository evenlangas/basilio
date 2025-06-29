import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Cookbook from '@/models/Cookbook';
import Recipe from '@/models/Recipe';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { recipeId, copyType = 'copy' } = await request.json(); // 'copy' or 'reference'

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    // Try to find user by session ID first, then by email
    let user = null;
    if (session.user.id) {
      user = await User.findById(session.user.id);
    }
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if cookbook exists and user has access
    const cookbook = await Cookbook.findById(id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user has access to the cookbook
    const hasAccess = cookbook.createdBy.equals(user._id) || 
                     cookbook.invitedUsers.includes(user._id);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Privacy validation: can't add private recipes to public cookbooks
    if (recipe.isPrivate && !cookbook.isPrivate) {
      return NextResponse.json({ 
        error: 'Cannot add private recipe to public cookbook. Make the recipe public first.' 
      }, { status: 400 });
    }

    // Check if user has access to the recipe
    const canAccessRecipe = !recipe.isPrivate || 
                           recipe.createdBy.equals(user._id) ||
                           (recipe.cookbookId && cookbook.invitedUsers.includes(user._id));
    
    if (!canAccessRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    if (copyType === 'reference') {
      // Add reference to the original recipe (no new recipe created)
      await Cookbook.findByIdAndUpdate(
        id,
        { $addToSet: { referencedRecipes: recipeId } }
      );

      return NextResponse.json({ 
        message: 'Recipe reference added to cookbook successfully',
        recipeId: recipeId,
        type: 'reference'
      });
    } else {
      // Create a copy of the recipe for this cookbook
      const recipeData = recipe.toObject();
      delete recipeData._id;
      delete recipeData.createdAt;
      delete recipeData.updatedAt;
      
      const copiedRecipe = new Recipe({
        ...recipeData,
        cookbookId: id,
        originalRecipe: recipeId,
        originalChef: recipe.createdBy,
        copiedBy: user._id,
        createdBy: user._id, // Current user becomes the owner of the copy
        isReference: false,
        isPrivate: cookbook.isPrivate, // Copy inherits cookbook privacy
        mealType: recipeData.mealType || '',
        cuisine: recipeData.cuisine || '',
      });

      await copiedRecipe.save();

      // Add the copied recipe to the cookbook
      await Cookbook.findByIdAndUpdate(
        id,
        { $addToSet: { recipes: copiedRecipe._id } }
      );

      return NextResponse.json({ 
        message: 'Recipe copied to cookbook successfully',
        recipeId: copiedRecipe._id,
        type: 'copy'
      });
    }
  } catch (error) {
    console.error('Error adding recipe to cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}