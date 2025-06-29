import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Cookbook from '@/models/Cookbook';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cookbook = await Cookbook.findById(id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the cookbook owner can view pending invites' }, { status: 403 });
    }

    // Get pending invitations for this cookbook
    const pendingInvites = await Notification.find({
      type: 'cookbook_invite',
      'data.cookbookId': cookbook._id,
      status: 'pending'
    }).populate('recipient', 'name email image');

    return NextResponse.json(pendingInvites);
  } catch (error) {
    console.error('Error fetching pending invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const cookbook = await Cookbook.findById(id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the cookbook owner can invite users' }, { status: 403 });
    }

    // Find the user to invite
    const userToInvite = await User.findById(userId);
    if (!userToInvite) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already invited
    if (cookbook.invitedUsers.includes(userToInvite._id)) {
      return NextResponse.json({ error: 'User is already invited to this cookbook' }, { status: 400 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() === userToInvite._id.toString()) {
      return NextResponse.json({ error: 'Cannot invite the cookbook owner' }, { status: 400 });
    }

    // Check if there's already a pending notification
    const existingNotification = await Notification.findOne({
      recipient: userToInvite._id,
      sender: currentUser._id,
      type: 'cookbook_invite',
      'data.cookbookId': cookbook._id,
      status: 'pending'
    });

    if (existingNotification) {
      return NextResponse.json({ error: 'Invite already sent to this user' }, { status: 400 });
    }

    // Create notification instead of directly adding to cookbook
    await Notification.create({
      recipient: userToInvite._id,
      sender: currentUser._id,
      type: 'cookbook_invite',
      title: 'Cookbook Invitation',
      message: `${currentUser.name} invited you to join the cookbook "${cookbook.name}"`,
      data: {
        cookbookId: cookbook._id
      }
    });

    return NextResponse.json({ message: 'Invitation sent successfully' });
  } catch (error) {
    console.error('Error inviting user to cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cookbook = await Cookbook.findById(id);
    if (!cookbook) {
      return NextResponse.json({ error: 'Cookbook not found' }, { status: 404 });
    }

    // Check if user is the owner
    if (cookbook.createdBy.toString() !== currentUser._id.toString()) {
      return NextResponse.json({ error: 'Only the cookbook owner can cancel invites' }, { status: 403 });
    }

    // Find and delete the notification
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Verify this notification belongs to this cookbook
    if (notification.data.cookbookId.toString() !== id) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 });
    }

    // Verify notification is pending
    if (notification.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending invitations' }, { status: 400 });
    }

    await Notification.findByIdAndDelete(notificationId);

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

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

    const cookbook = await Cookbook.findById(id);
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