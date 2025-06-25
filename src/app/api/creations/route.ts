import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
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

    // Get creations from this user
    const creations = await Creation.find({ createdBy: user._id })
      .populate('createdBy', 'name image')
      .populate('recipe', 'title')
      .sort({ createdAt: -1 });

    return NextResponse.json(creations);
  } catch (error) {
    console.error('Error fetching creations:', error);
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
    const { title, description, image, recipe, eatenWith, cookingTime } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creation = new Creation({
      title,
      description: description || '',
      image: image || '',
      recipe: recipe || null,
      eatenWith: eatenWith || '',
      cookingTime: cookingTime || 0,
      createdBy: user._id,
      likes: [],
      comments: [],
    });

    await creation.save();
    
    // Update user stats
    await User.findByIdAndUpdate(user._id, {
      $inc: { 
        'stats.creationsPosted': 1,
        'stats.cookingHours': cookingTime ? Math.floor(cookingTime / 60) : 0
      }
    });

    await creation.populate('createdBy', 'name image');
    await creation.populate('recipe', 'title');

    return NextResponse.json(creation, { status: 201 });
  } catch (error) {
    console.error('Error creating creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}