import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import Cookbook from '@/models/Cookbook';
import ShoppingList from '@/models/ShoppingList';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Ensure models are registered
    Cookbook;
    ShoppingList;

    const notifications = await Notification.find({ recipient: session.user.id })
      .populate('sender', 'name image')
      .populate('data.cookbookId', 'name')
      .populate('data.shoppingListId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
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

    const { recipient, type, title, message, data } = await request.json();
    
    await dbConnect();

    const notification = await Notification.create({
      recipient,
      sender: session.user.id,
      type,
      title,
      message,
      data,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}