import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';
import User from '@/models/User';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const shoppingList = await ShoppingList.findById(id)
      .populate('createdBy', 'name image')
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

    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Check access permissions
    const isOwner = shoppingList.createdBy._id.toString() === user._id.toString();
    const isInvited = shoppingList.invitedUsers?.some((invitedUser: any) => 
      invitedUser._id.toString() === user._id.toString()
    ) || false;
    const isFamilyMember = session.user.familyId && shoppingList.familyId?.toString() === session.user.familyId;

    if (!isOwner && !isInvited && !isFamilyMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Ensure recipeLog field exists (for backward compatibility)
    if (!shoppingList.recipeLog) {
      shoppingList.recipeLog = [];
      await shoppingList.save();
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id } = await params;
    
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
    const isFamilyMember = session.user.familyId && shoppingList.familyId?.toString() === session.user.familyId;

    if (!isOwner && !isInvited && !isFamilyMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updatedList = await ShoppingList.findByIdAndUpdate(
      id,
      data,
      { new: true }
    ).populate('createdBy', 'name image').populate('invitedUsers', 'name email image').populate('items.addedBy', 'name')
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

    // Ensure recipeLog field exists (for backward compatibility)
    if (!updatedList.recipeLog) {
      updatedList.recipeLog = [];
      await updatedList.save();
    }

    return NextResponse.json(updatedList);
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const shoppingList = await ShoppingList.findById(id);
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Only the owner can delete the list
    const isOwner = shoppingList.createdBy.toString() === user._id.toString();
    if (!isOwner) {
      return NextResponse.json({ error: 'Only the list owner can delete it' }, { status: 403 });
    }

    await ShoppingList.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Shopping list deleted successfully' });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}