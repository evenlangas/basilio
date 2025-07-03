import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import User from '@/models/User';
import Notification from '@/models/Notification';

// Helper function to extract user mentions from text
const extractMentions = (text: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const creation = await Creation.findById(params.id)
      .populate({
        path: 'comments.user',
        select: 'name image'
      });

    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    return NextResponse.json(creation.comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    const { text } = await request.json();
    
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    const creation = await Creation.findById(params.id);
    if (!creation) {
      return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
    }

    // Add the comment
    const newComment = {
      user: user._id,
      text: text.trim(),
      createdAt: new Date()
    };

    creation.comments.push(newComment);
    await creation.save();

    // Create notification if user is commenting on someone else's creation
    if (creation.createdBy.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: creation.createdBy,
        sender: user._id,
        type: 'comment',
        title: 'Someone commented on your creation!',
        message: `${user.name} commented on your creation "${creation.title}"`,
        data: {
          creationId: creation._id,
          commentId: newComment._id,
        },
      });
    }

    // Create notifications for mentioned users
    const mentions = extractMentions(text.trim());
    if (mentions.length > 0) {
      const mentionedUsers = await User.find({ 
        name: { $in: mentions.map(mention => new RegExp(`^${mention}$`, 'i')) }
      });

      for (const mentionedUser of mentionedUsers) {
        // Don't notify the commenter themselves
        if (mentionedUser._id.toString() !== user._id.toString()) {
          await Notification.create({
            recipient: mentionedUser._id,
            sender: user._id,
            type: 'comment',
            title: 'You were mentioned in a comment!',
            message: `${user.name} mentioned you in a comment on "${creation.title}"`,
            data: {
              creationId: creation._id,
              commentId: newComment._id,
            },
          });
        }
      }
    }

    // Populate the new comment with user data
    await creation.populate({
      path: 'comments.user',
      select: 'name image'
    });

    // Return the newly created comment
    const addedComment = creation.comments[creation.comments.length - 1];
    
    return NextResponse.json(addedComment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}