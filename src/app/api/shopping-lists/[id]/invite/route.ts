import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';
import User from '@/models/User';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const shoppingList = await ShoppingList.findById(params.id);
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (shoppingList.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the list owner can invite users' }, { status: 403 });
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return NextResponse.json({ error: 'User with this email not found' }, { status: 404 });
    }

    // Initialize invitedUsers array if it doesn't exist
    if (!shoppingList.invitedUsers) {
      shoppingList.invitedUsers = [];
    }

    // Check if user is already invited
    if (shoppingList.invitedUsers.includes(userToInvite._id)) {
      return NextResponse.json({ error: 'User is already invited to this list' }, { status: 400 });
    }

    // Check if user is the owner
    if (shoppingList.createdBy.toString() === userToInvite._id.toString()) {
      return NextResponse.json({ error: 'Cannot invite the list owner' }, { status: 400 });
    }

    // Add user to invited list
    shoppingList.invitedUsers.push(userToInvite._id);
    await shoppingList.save();

    return NextResponse.json({ message: 'User invited successfully' });
  } catch (error) {
    console.error('Error inviting user to shopping list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const shoppingList = await ShoppingList.findById(params.id);
    if (!shoppingList) {
      return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (shoppingList.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the list owner can remove users' }, { status: 403 });
    }

    // Remove user from invited list
    if (shoppingList.invitedUsers) {
      shoppingList.invitedUsers = shoppingList.invitedUsers.filter(
        (invitedUserId: any) => invitedUserId.toString() !== userId
      );
      await shoppingList.save();
    }

    return NextResponse.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user from shopping list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}