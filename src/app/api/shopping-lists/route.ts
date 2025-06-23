import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let query: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only show family shopping lists
      query = { familyId: session.user.familyId };
    } else {
      // If user has no family, show only their personal lists
      query = { createdBy: session.user.id, familyId: null };
    }

    const shoppingLists = await ShoppingList.find(query)
      .populate('createdBy', 'name')
      .populate('items.addedBy', 'name')
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
    
    await dbConnect();

    // For family users, check if a shopping list already exists
    if (session.user.familyId) {
      const existingList = await ShoppingList.findOne({ familyId: session.user.familyId });
      if (existingList) {
        return NextResponse.json({ error: 'Family already has a shopping list' }, { status: 400 });
      }
    }

    const shoppingList = await ShoppingList.create({
      ...data,
      createdBy: session.user.id,
      familyId: session.user.familyId || null,
    });

    const populatedList = await ShoppingList.findById(shoppingList._id)
      .populate('createdBy', 'name')
      .populate('items.addedBy', 'name');

    return NextResponse.json(populatedList, { status: 201 });
  } catch (error) {
    console.error('Create shopping list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}