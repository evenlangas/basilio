import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';
import User from '@/models/User';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = await params;
    const { items } = data; // Array of items with their new order
    
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const shoppingList = await ShoppingList.findById(id);
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = shoppingList.createdBy.toString() === user._id.toString();
    const isInvited = shoppingList.invitedUsers?.some((invitedUserId: any) => 
      invitedUserId.toString() === user._id.toString()
    );

    if (!isOwner && !isInvited) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update the items array with new order
    // Each item should have the same data but with updated order field
    const updatedItems = items.map((item: any, index: number) => ({
      ...item,
      order: index
    }));

    const updatedList = await ShoppingList.findByIdAndUpdate(
      id,
      { items: updatedItems },
      { new: true }
    ).populate('createdBy', 'name image')
     .populate('invitedUsers', 'name email image')
     .populate('items.addedBy', 'name')
     .populate({
       path: 'recipeLog.recipe',
       select: 'title image cookingTime servings',
       options: { strictPopulate: false }
     })
     .populate({
       path: 'recipeLog.addedBy', 
       select: 'name image',
       options: { strictPopulate: false }
     });

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Reorder shopping list items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}