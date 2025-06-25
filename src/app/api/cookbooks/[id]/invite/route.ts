import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Cookbook from '@/models/Cookbook';
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

    const cookbook = await Cookbook.findById(params.id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the cookbook owner can invite users' }, { status: 403 });
    }

    // Find the user to invite
    const userToInvite = await User.findOne({ email: email.toLowerCase() });
    if (!userToInvite) {
      return NextResponse.json({ error: 'User with this email not found' }, { status: 404 });
    }

    // Check if user is already invited
    if (cookbook.invitedUsers.includes(userToInvite._id)) {
      return NextResponse.json({ error: 'User is already invited to this cookbook' }, { status: 400 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() === userToInvite._id.toString()) {
      return NextResponse.json({ error: 'Cannot invite the cookbook owner' }, { status: 400 });
    }

    // Add user to invited list
    cookbook.invitedUsers.push(userToInvite._id);
    await cookbook.save();

    return NextResponse.json({ message: 'User invited successfully' });
  } catch (error) {
    console.error('Error inviting user to cookbook:', error);
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

    const cookbook = await Cookbook.findById(params.id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the cookbook owner can remove users' }, { status: 403 });
    }

    // Remove user from invited list
    cookbook.invitedUsers = cookbook.invitedUsers.filter(
      (invitedUserId: any) => invitedUserId.toString() !== userId
    );
    await cookbook.save();

    return NextResponse.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user from cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}