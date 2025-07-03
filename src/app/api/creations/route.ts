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

// Helper function to update recipe ratings
const updateRecipeRating = async (recipeId: string, userId: string, rating: number, creationId: string) => {
  try {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return;

    // Check if user has already rated this recipe
    const existingRatingIndex = recipe.ratings.findIndex(
      (r: any) => r.user.toString() === userId.toString()
    );

    if (existingRatingIndex >= 0) {
      // Update existing rating
      recipe.ratings[existingRatingIndex].rating = rating;
      recipe.ratings[existingRatingIndex].creation = creationId;
    } else {
      // Add new rating
      recipe.ratings.push({
        user: userId,
        rating: rating,
        creation: creationId,
        createdAt: new Date()
      });
    }

    // Recalculate average rating
    const totalRatings = recipe.ratings.length;
    const sumRatings = recipe.ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
    
    recipe.averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
    recipe.totalRatings = totalRatings;

    await recipe.save();
  } catch (error) {
    console.error('Error updating recipe rating:', error);
  }
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
    const { title, description, image, recipe, recipeRating, eatenWith, cookingTime, drankWith, chefName } = body;

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
      recipeRating: recipeRating || null,
      eatenWith: eatenWith || '',
      cookingTime: cookingTime || 0,
      drankWith: drankWith || '',
      chefName: chefName || '',
      createdBy: user._id,
      likes: [],
      comments: [],
    });

    await creation.save();

    // Update recipe ratings if a rating was provided
    if (recipe && recipeRating && typeof recipeRating === 'number' && recipeRating >= 0 && recipeRating <= 5) {
      await updateRecipeRating(recipe, user._id, recipeRating, creation._id);
    }
    
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