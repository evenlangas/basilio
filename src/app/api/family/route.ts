import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Family from '@/models/Family';
import User from '@/models/User';
import ShoppingList from '@/models/ShoppingList';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user || !user.familyId) {
      return NextResponse.json({ family: null });
    }

    const family = await Family.findById(user.familyId).populate('members', 'name email');
    
    return NextResponse.json({ family });
  } catch (error) {
    console.error('Get family error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Family name is required' }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user || !user.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    const family = await Family.findByIdAndUpdate(
      user.familyId,
      { name: name.trim() },
      { new: true }
    ).populate('members', 'name email');

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    // Update the shopping list name to match the new family name
    await ShoppingList.findOneAndUpdate(
      { familyId: user.familyId },
      { name: `${name.trim()} Shopping List` }
    );

    return NextResponse.json({ family });
  } catch (error) {
    console.error('Update family error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user || !user.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    const family = await Family.findById(user.familyId);
    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    await Family.findByIdAndUpdate(user.familyId, {
      $pull: { members: session.user.id }
    });

    await User.findByIdAndUpdate(session.user.id, { familyId: null });

    const updatedFamily = await Family.findById(user.familyId);
    if (updatedFamily && updatedFamily.members.length === 0) {
      await Family.findByIdAndDelete(user.familyId);
    }

    return NextResponse.json({ message: 'Left family successfully' });
  } catch (error) {
    console.error('Leave family error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}