import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
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
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const creation = await Creation.findById(params.id);
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Check if user already yummed this creation
    const hasYummed = creation.likes.includes(user._id);
    
    if (hasYummed) {
      // Remove yum (unyum)
      creation.likes = creation.likes.filter(
        (like: any) => like.toString() !== user._id.toString()
      );
    } else {
      // Add yum
      creation.likes.push(user._id);
      
      // Create notification if user is yumming someone else's creation
      if (creation.createdBy.toString() !== user._id.toString()) {
        await Notification.create({
          recipient: creation.createdBy,
          sender: user._id,
          type: 'yum',
          title: 'Someone yummed your creation!',
          message: `${user.name} yummed your creation "${creation.title}"`,
          data: {
            creationId: creation._id,
          },
        });
      }
    }

    await creation.save();

    // Return the updated creation with populated likes to show who yummed
    const updatedCreation = await Creation.findById(params.id)
      .populate('likes', 'name image')
      .populate('createdBy', 'name image')
      .populate('recipe', 'title');

    return NextResponse.json({
      creation: updatedCreation,
      hasYummed: !hasYummed,
      yumCount: updatedCreation.likes.length
    });
  } catch (error) {
    console.error('Error toggling yum:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const creation = await Creation.findById(params.id)
      .populate('likes', 'name image');
    
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    return NextResponse.json({
      likes: creation.likes,
      count: creation.likes.length
    });
  } catch (error) {
    console.error('Error fetching yums:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}