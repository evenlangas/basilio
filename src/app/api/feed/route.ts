import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Creation from '@/models/Creation';
import Recipe from '@/models/Recipe';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    // Ensure models are registered
    Recipe;
    Creation;
    
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get users this user follows AND the user themselves
    const followingIds = user.following || [];
    const allUserIds = [user._id, ...followingIds];

    // Get creations from followed users and self
    const creations = await Creation.find({ 
      createdBy: { $in: allUserIds } 
    })
    .populate('createdBy', 'name image')
    .populate('likes', 'name image')
    .populate('chef', 'name image') // Populate new chef field
    .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
    .populate('recipes.recipe', 'title description cookingTime servings averageRating')
    .populate('recipe', 'title description cookingTime servings averageRating')
    .sort({ createdAt: -1 })
    .limit(25); // Limit to recent 25 creations

    // Get public recipes from followed users and self (recent recipes)
    const recipes = await Recipe.find({ 
      createdBy: { $in: allUserIds },
      isPrivate: false
    })
    .populate('createdBy', 'name image')
    .sort({ createdAt: -1 })
    .limit(10); // Limit to recent 10 recipes

    // Combine and sort by creation date
    const combinedFeed = [
      ...creations.map(creation => ({ ...creation.toObject(), type: 'creation' })),
      ...recipes.map(recipe => ({ ...recipe.toObject(), type: 'recipe' }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(combinedFeed);
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}