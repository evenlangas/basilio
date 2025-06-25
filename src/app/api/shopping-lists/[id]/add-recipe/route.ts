import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';
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
    const { recipeId, servings = 1 } = await request.json();

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

    // Check if shopping list exists and user has access
    const shoppingList = await ShoppingList.findById(id);
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Check if user has access to the shopping list
    const hasAccess = shoppingList.createdBy.equals(user._id) || 
                     shoppingList.invitedUsers.includes(user._id);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the recipe
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    let addedCount = 0;
    let combinedCount = 0;

    // Process each ingredient
    for (const ingredient of recipe.ingredients) {
      if (!ingredient.name.trim()) continue;

      // Calculate adjusted amount based on servings
      let adjustedAmount = ingredient.amount;
      if (servings !== (recipe.servings || 1) && ingredient.amount) {
        const originalAmount = parseFloat(ingredient.amount);
        if (!isNaN(originalAmount)) {
          const multiplier = servings / (recipe.servings || 1);
          adjustedAmount = (originalAmount * multiplier).toString();
        }
      }

      // Check if ingredient already exists in shopping list
      const existingItemIndex = shoppingList.items.findIndex(
        item => item.name.toLowerCase() === ingredient.name.toLowerCase() &&
                item.unit.toLowerCase() === (ingredient.unit || '').toLowerCase()
      );

      if (existingItemIndex !== -1) {
        // Combine with existing item
        const existingItem = shoppingList.items[existingItemIndex];
        const existingAmount = parseFloat(existingItem.amount) || 0;
        const newAmount = parseFloat(adjustedAmount) || 0;
        
        if (!isNaN(existingAmount) && !isNaN(newAmount)) {
          shoppingList.items[existingItemIndex].amount = (existingAmount + newAmount).toString();
        } else if (adjustedAmount && !existingItem.amount) {
          shoppingList.items[existingItemIndex].amount = adjustedAmount;
        }
        
        combinedCount++;
      } else {
        // Add new item
        shoppingList.items.push({
          name: ingredient.name,
          amount: adjustedAmount || '',
          unit: ingredient.unit || '',
          completed: false,
        });
        addedCount++;
      }
    }

    await shoppingList.save();

    return NextResponse.json({ 
      addedCount, 
      combinedCount,
      message: 'Ingredients added to shopping list successfully' 
    });
  } catch (error) {
    console.error('Error adding recipe to shopping list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}