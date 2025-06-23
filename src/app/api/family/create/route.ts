import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Family from '@/models/Family';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import ShoppingList from '@/models/ShoppingList';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Family name is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.familyId) {
      return NextResponse.json({ error: 'User already belongs to a family' }, { status: 400 });
    }

    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Family.findOne({ inviteCode });
      if (!existing) {
        isUnique = true;
      }
    }

    const family = await Family.create({
      name: name.trim(),
      members: [session.user.id],
      inviteCode,
    });

    await User.findByIdAndUpdate(session.user.id, { familyId: family._id });

    // Migrate user's existing recipes to the family
    await Recipe.updateMany(
      { createdBy: session.user.id, familyId: null },
      { familyId: family._id }
    );

    // Get user's existing shopping list items and merge them into a new family shopping list
    const userShoppingLists = await ShoppingList.find({ 
      createdBy: session.user.id, 
      familyId: null 
    });
    
    // Collect all items from user's personal shopping lists
    const allItems = [];
    for (const list of userShoppingLists) {
      allItems.push(...list.items);
    }

    // Create the family shopping list with merged items
    await ShoppingList.create({
      name: `${family.name} Shopping List`,
      items: allItems,
      createdBy: session.user.id,
      familyId: family._id,
    });

    // Delete user's old personal shopping lists
    await ShoppingList.deleteMany({ 
      createdBy: session.user.id, 
      familyId: null 
    });

    return NextResponse.json({
      family: {
        _id: family._id,
        name: family.name,
        inviteCode: family.inviteCode,
        members: [{ _id: user._id, name: user.name, email: user.email }],
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Create family error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}