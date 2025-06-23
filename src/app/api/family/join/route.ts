import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Family from '@/models/Family';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import ShoppingList from '@/models/ShoppingList';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await request.json();

    if (!inviteCode?.trim()) {
      return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.familyId) {
      return NextResponse.json({ error: 'User already belongs to a family' }, { status: 400 });
    }

    const family = await Family.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!family) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    if (family.members.includes(session.user.id)) {
      return NextResponse.json({ error: 'User already in this family' }, { status: 400 });
    }

    await Family.findByIdAndUpdate(family._id, {
      $addToSet: { members: session.user.id }
    });

    await User.findByIdAndUpdate(session.user.id, { familyId: family._id });

    // Migrate user's existing recipes to the family
    await Recipe.updateMany(
      { createdBy: session.user.id, familyId: null },
      { familyId: family._id }
    );

    // Get user's existing shopping list items and merge them into the family shopping list
    const userShoppingLists = await ShoppingList.find({ 
      createdBy: session.user.id, 
      familyId: null 
    });
    
    // Get the existing family shopping list
    let familyShoppingList = await ShoppingList.findOne({ familyId: family._id });
    
    if (!familyShoppingList) {
      // If no family shopping list exists, create one
      const allItems = [];
      for (const list of userShoppingLists) {
        allItems.push(...list.items);
      }
      
      familyShoppingList = await ShoppingList.create({
        name: `${family.name} Shopping List`,
        items: allItems,
        createdBy: session.user.id,
        familyId: family._id,
      });
    } else {
      // Merge user's items into existing family shopping list
      const userItems = [];
      for (const list of userShoppingLists) {
        userItems.push(...list.items);
      }
      
      if (userItems.length > 0) {
        // Convert existing items to plain objects to avoid Mongoose issues
        const existingItems = familyShoppingList.items.map(item => 
          item.toObject ? item.toObject() : item
        );
        
        // Add user's items to the family shopping list
        const updatedItems = [...existingItems, ...userItems];
        
        await ShoppingList.findByIdAndUpdate(familyShoppingList._id, {
          items: updatedItems
        });
      }
    }

    // Delete user's old personal shopping lists
    await ShoppingList.deleteMany({ 
      createdBy: session.user.id, 
      familyId: null 
    });

    const updatedFamily = await Family.findById(family._id).populate('members', 'name email');

    return NextResponse.json({
      family: updatedFamily
    });
  } catch (error) {
    console.error('Join family error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}