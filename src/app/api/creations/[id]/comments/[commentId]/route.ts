import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import User from '@/models/User';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
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

    // Find the comment to edit
    const commentIndex = creation.comments.findIndex(
      (comment: any) => comment._id.toString() === params.commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if the user owns this comment
    if (creation.comments[commentIndex].user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }

    // Update the comment
    creation.comments[commentIndex].text = text.trim();
    creation.comments[commentIndex].updatedAt = new Date();

    await creation.save();

    // Populate the updated comment with user data
    await creation.populate({
      path: 'comments.user',
      select: 'name image'
    });

    // Return the updated comment
    const updatedComment = creation.comments[commentIndex];
    
    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
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

    // Find the comment to delete
    const commentIndex = creation.comments.findIndex(
      (comment: any) => comment._id.toString() === params.commentId
    );

    if (commentIndex === -1) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if the user owns this comment
    if (creation.comments[commentIndex].user.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 });
    }

    // Remove the comment
    creation.comments.splice(commentIndex, 1);
    await creation.save();

    return NextResponse.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}