import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';
import Recipe from '@/models/Recipe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    Recipe;

    // Show lists the user owns or is invited to
    const query = {
      $or: [
        { createdBy: session.user.id },
        { invitedUsers: session.user.id }
      ]
    };

    const shoppingLists = await ShoppingList.find(query)
      .populate('createdBy', 'name')
      .populate('items.addedBy', 'name')
      .populate('invitedUsers', 'name image')
      .sort({ createdAt: -1 });

    return NextResponse.json(shoppingLists);
  } catch (error) {
    console.error('Get shopping lists error:', error);
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

    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    
    await dbConnect();
    Recipe;

    const listData = {
      name: data.name.trim(),
      items: [],
      createdBy: session.user.id,
      invitedUsers: [],
      recipeLog: []
    };
    
    const shoppingList = await ShoppingList.create(listData);
    const populatedList = await ShoppingList.findById(shoppingList._id)
      .populate('createdBy', 'name')
      .populate('items.addedBy', 'name');

    return NextResponse.json(populatedList, { status: 201 });
  } catch (error) {
    console.error('Create shopping list error:', error);
    console.error('Error details:', error.message);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}