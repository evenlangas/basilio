import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Cookbook from '@/models/Cookbook';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get cookbooks user created or was invited to
    const cookbooks = await Cookbook.find({
      $or: [
        { createdBy: user._id },
        { invitedUsers: user._id }
      ]
    })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

    return NextResponse.json(cookbooks);
  } catch (error) {
    console.error('Error fetching cookbooks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isPrivate } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cookbook = new Cookbook({
      name,
      description: description || '',
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      createdBy: user._id,
      recipes: [],
      invitedUsers: [],
    });

    await cookbook.save();
    await cookbook.populate('createdBy', 'name');

    return NextResponse.json(cookbook, { status: 201 });
  } catch (error) {
    console.error('Error creating cookbook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}