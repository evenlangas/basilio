import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Cookbook from '@/models/Cookbook';
import ShoppingList from '@/models/ShoppingList';
import User from '@/models/User';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, read } = await request.json();
    const { id } = await params;
    
    await dbConnect();

    const notification = await Notification.findById(id);
    
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.recipient.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update read status
    if (read !== undefined) {
      notification.read = read;
    }

    // Handle invite responses
    if (status && ['accepted', 'declined'].includes(status)) {
      notification.status = status;
      notification.respondedAt = new Date();

      if (status === 'accepted') {
        // Add user to cookbook or shopping list
        if (notification.type === 'cookbook_invite' && notification.data.cookbookId) {
          await Cookbook.findByIdAndUpdate(
            notification.data.cookbookId,
            { $addToSet: { invitedUsers: session.user.id } }
          );
        } else if (notification.type === 'shopping_list_invite' && notification.data.shoppingListId) {
          await ShoppingList.findByIdAndUpdate(
            notification.data.shoppingListId,
            { $addToSet: { invitedUsers: session.user.id } }
          );
        } else if (notification.type === 'follow_request') {
          // Handle follow request acceptance
          const follower = await User.findById(notification.sender);
          const recipient = await User.findById(notification.recipient);
          
          if (follower && recipient) {
            // Remove from pending followers
            if (recipient.pendingFollowers) {
              recipient.pendingFollowers = recipient.pendingFollowers.filter(
                (id: any) => id.toString() !== follower._id.toString()
              );
            }
            
            // Add to followers/following lists
            if (!follower.following) {
              follower.following = [];
            }
            if (!recipient.followers) {
              recipient.followers = [];
            }
            
            if (!follower.following.includes(recipient._id)) {
              follower.following.push(recipient._id);
            }
            if (!recipient.followers.includes(follower._id)) {
              recipient.followers.push(follower._id);
            }
            
            await Promise.all([
              follower.save(),
              recipient.save()
            ]);
            
            // Create a follow notification for the requester to let them know they were accepted
            await Notification.create({
              recipient: follower._id,
              sender: recipient._id,
              type: 'follow',
              title: 'Follow request accepted',
              message: `${recipient.name} accepted your follow request`,
              data: {},
            });
          }
        }
      } else if (status === 'declined' && notification.type === 'follow_request') {
        // Handle follow request decline - just remove from pending followers
        const follower = await User.findById(notification.sender);
        const recipient = await User.findById(notification.recipient);
        
        if (follower && recipient && recipient.pendingFollowers) {
          recipient.pendingFollowers = recipient.pendingFollowers.filter(
            (id: any) => id.toString() !== follower._id.toString()
          );
          await recipient.save();
        }
      }
    }

    await notification.save();

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}