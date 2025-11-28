import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { listId } = await request.json();

    // Update user's pinned shopping list (null to unpin)
    const user = await User.findByIdAndUpdate(
      session.user.id,
      { pinnedShoppingList: listId || null },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      pinnedShoppingList: user.pinnedShoppingList 
    });
  } catch (error) {
    console.error('Error pinning shopping list:', error);
    return NextResponse.json(
      { error: 'Failed to pin shopping list' },
      { status: 500 }
    );
  }
}
