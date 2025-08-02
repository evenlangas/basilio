import { NextResponse } from 'next/server';
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
    User;
    
    // Get trending creations based on recent activity (likes, comments, and recency)
    // We'll use a simple scoring system: likes count + comments count + recency factor
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const creations = await Creation.find({
      createdAt: { $gte: oneWeekAgo }
    })
    .populate('createdBy', 'name image')
    .populate('likes', 'name image')
    .populate('chef', 'name image') // Populate new chef field
    .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
    .populate('recipes.recipe', 'title')
    .sort({ createdAt: -1 });
    
    // Score each creation based on engagement
    const scoredCreations = creations.map(creation => {
      const likesCount = creation.likes?.length || 0;
      const commentsCount = creation.comments?.length || 0;
      const daysOld = Math.floor((Date.now() - creation.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const recencyScore = Math.max(0, 7 - daysOld); // More recent = higher score
      
      const score = likesCount + commentsCount + recencyScore;
      
      return {
        ...creation.toObject(),
        score
      };
    });
    
    // Sort by score descending and take top 10
    const trendingCreations = scoredCreations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    
    return NextResponse.json(trendingCreations);
  } catch (error) {
    console.error('Error fetching trending creations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}