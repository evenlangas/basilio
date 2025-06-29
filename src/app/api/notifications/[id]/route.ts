import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Cookbook from '@/models/Cookbook';
import ShoppingList from '@/models/ShoppingList';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, read } = await request.json();
    
    await dbConnect();

    const notification = await Notification.findById(params.id);
    
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