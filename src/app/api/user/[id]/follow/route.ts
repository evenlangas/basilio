import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Can't follow yourself
    if (currentUser._id.toString() === targetUser._id.toString()) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Check if already following
    const isAlreadyFollowing = currentUser.following?.includes(targetUser._id);
    if (isAlreadyFollowing) {
      return NextResponse.json({ error: 'Already following this user' }, { status: 400 });
    }

    // If target user is private, add to pending followers instead
    if (targetUser.isPrivate) {
      if (!targetUser.pendingFollowers) {
        targetUser.pendingFollowers = [];
      }
      
      const isAlreadyPending = targetUser.pendingFollowers.includes(currentUser._id);
      if (!isAlreadyPending) {
        targetUser.pendingFollowers.push(currentUser._id);
        await targetUser.save();
        
        // Create follow request notification
        await Notification.create({
          recipient: targetUser._id,
          sender: currentUser._id,
          type: 'follow_request',
          title: 'New follow request',
          message: `${currentUser.name} wants to follow you`,
          data: {},
        });
      }
      
      return NextResponse.json({ message: 'Follow request sent' });
    }

    // Add to following/followers lists
    if (!currentUser.following) {
      currentUser.following = [];
    }
    if (!targetUser.followers) {
      targetUser.followers = [];
    }

    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);
    
    // Create follow notification for public accounts
    await Notification.create({
      recipient: targetUser._id,
      sender: currentUser._id,
      type: 'follow',
      title: 'New follower',
      message: `${currentUser.name} is now following you`,
      data: {},
    });

    return NextResponse.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
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

    await dbConnect();
    
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found' }, { status: 404 });
    }

    const targetUser = await User.findById(params.id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Remove from following/followers lists
    if (currentUser.following) {
      currentUser.following = currentUser.following.filter(
        (id: any) => id.toString() !== targetUser._id.toString()
      );
    }

    if (targetUser.followers) {
      targetUser.followers = targetUser.followers.filter(
        (id: any) => id.toString() !== currentUser._id.toString()
      );
    }

    // Also remove from pending followers if exists
    if (targetUser.pendingFollowers) {
      targetUser.pendingFollowers = targetUser.pendingFollowers.filter(
        (id: any) => id.toString() !== currentUser._id.toString()
      );
    }

    await Promise.all([
      currentUser.save(),
      targetUser.save()
    ]);

    return NextResponse.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}