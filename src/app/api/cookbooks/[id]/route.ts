import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Cookbook from '@/models/Cookbook';
import Recipe from '@/models/Recipe';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const cookbook = await Cookbook.findById(id)
      .populate('createdBy', 'name image')
      .populate('invitedUsers', 'name image')
      .populate({
        path: 'recipes',
        select: 'title description image cookingTime servings tags cuisine mealType createdBy originalRecipe originalChef isReference',
        populate: {
          path: 'createdBy originalChef',
          select: 'name image'
        },
        options: { sort: { createdAt: -1 } }
      })
      .populate({
        path: 'referencedRecipes',
        select: 'title description image cookingTime servings tags cuisine mealType createdBy isPrivate',
        populate: {
          path: 'createdBy',
          select: 'name image'
        },
        options: { sort: { createdAt: -1 } }
      });

    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = cookbook.createdBy._id.toString() === user._id.toString();
    const isInvited = cookbook.invitedUsers.some((invitedUser: any) => 
      invitedUser._id.toString() === user._id.toString()
    );

    if (cookbook.isPrivate && !isOwner && !isInvited) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const cookbookData = cookbook.toObject();
    
    // Filter out private referenced recipes that the user can't access
    const accessibleReferencedRecipes = cookbookData.referencedRecipes?.filter((recipe: any) => {
      return !recipe.isPrivate || recipe.createdBy._id.toString() === user._id.toString();
    }) || [];

    // Mark referenced recipes with a flag for frontend identification
    const markedReferencedRecipes = accessibleReferencedRecipes.map((recipe: any) => ({
      ...recipe,
      isReference: true,
      originalRecipe: recipe._id,
      originalChef: recipe.createdBy
    }));

    // Combine owned recipes and accessible referenced recipes
    cookbookData.allRecipes = [
      ...(cookbookData.recipes || []),
      ...markedReferencedRecipes
    ].sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime());

    return NextResponse.json(cookbookData);
  } catch (error) {
    console.error('Error fetching cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPrivate } = body;

    await dbConnect();
    Recipe;
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id } = await params;
    const cookbook = await Cookbook.findById(id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update cookbook
    if (name !== undefined) cookbook.name = name;
    if (description !== undefined) cookbook.description = description;
    if (isPrivate !== undefined) cookbook.isPrivate = isPrivate;

    await cookbook.save();
    await cookbook.populate('createdBy', 'name');

    return NextResponse.json(cookbook);
  } catch (error) {
    console.error('Error updating cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
    const cookbook = await Cookbook.findById(id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Remove cookbook reference from all recipes
    await Recipe.updateMany(
      { cookbookId: cookbook._id },
      { $unset: { cookbookId: 1 } }
    );

    // Delete the cookbook
    await Cookbook.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Cookbook deleted successfully' });
  } catch (error) {
    console.error('Error deleting cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}