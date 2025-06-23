import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    let query: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only allow access to family lists
      query = { _id: id, familyId: session.user.familyId };
    } else {
      // If user has no family, only allow access to their personal lists
      query = { _id: id, createdBy: session.user.id, familyId: null };
    }

    const shoppingList = await ShoppingList.findOne(query)
      .populate('createdBy', 'name')
      .populate('items.addedBy', 'name');

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    return NextResponse.json(shoppingList);
  } catch (error) {
    console.error('Get shopping list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = await params;
    
    await dbConnect();

    let updateQuery: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only allow updating family lists
      updateQuery = { _id: id, familyId: session.user.familyId };
    } else {
      // If user has no family, only allow updating their personal lists
      updateQuery = { _id: id, createdBy: session.user.id, familyId: null };
    }

    const shoppingList = await ShoppingList.findOneAndUpdate(
      updateQuery,
      data,
      { new: true }
    ).populate('createdBy', 'name').populate('items.addedBy', 'name');

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    return NextResponse.json(shoppingList);
  } catch (error) {
    console.error('Update shopping list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    let deleteQuery: any;
    
    if (session.user.familyId) {
      // If user is part of a family, only allow deleting family lists
      deleteQuery = { _id: id, familyId: session.user.familyId };
    } else {
      // If user has no family, only allow deleting their personal lists
      deleteQuery = { _id: id, createdBy: session.user.id, familyId: null };
    }

    const shoppingList = await ShoppingList.findOneAndDelete(deleteQuery);

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Shopping list deleted successfully' });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}