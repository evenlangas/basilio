import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import Notification from '@/models/Notification';

// Helper function to extract user mentions from text
const extractMentions = (text: string): string[] => {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    Recipe;
    
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
    const { title, description, image, recipe, eatenWith, cookingTime, drankWith, chefName } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    await dbConnect();
    Recipe;
    
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
      drankWith: drankWith || '',
      chefName: chefName || '',
      createdBy: user._id,
      likes: [],
      comments: [],
    });

    await creation.save();
    
    // Create notifications for mentions in eatenWith and chefName
    const allMentions = [
      ...extractMentions(eatenWith || ''),
      ...extractMentions(chefName || '')
    ];
    
    if (allMentions.length > 0) {
      const mentionedUsers = await User.find({ 
        name: { $in: allMentions.map(mention => new RegExp(`^${mention}$`, 'i')) }
      });

      for (const mentionedUser of mentionedUsers) {
        // Don't notify the creator themselves
        if (mentionedUser._id.toString() !== user._id.toString()) {
          const isChef = extractMentions(chefName || '').some(mention => 
            mentionedUser.name.toLowerCase() === mention.toLowerCase()
          );
          const isEatenWith = extractMentions(eatenWith || '').some(mention => 
            mentionedUser.name.toLowerCase() === mention.toLowerCase()
          );

          let notificationMessage = '';
          if (isChef) {
            notificationMessage = `${user.name} credited you as the chef for "${title}"`;
          } else if (isEatenWith) {
            notificationMessage = `${user.name} mentioned you in their creation "${title}"`;
          }

          if (notificationMessage) {
            await Notification.create({
              recipient: mentionedUser._id,
              sender: user._id,
              type: 'yum',
              title: 'You were mentioned in a creation!',
              message: notificationMessage,
              data: {
                creationId: creation._id,
              },
            });
          }
        }
      }
    }
    
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