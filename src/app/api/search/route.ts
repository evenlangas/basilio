import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Recipe from '@/models/Recipe';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json([]);
    }

    await dbConnect();
    
    const searchRegex = new RegExp(query, 'i');
    
    // Search users
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    })
    .select('name image bio')
    .limit(10);

    // Search recipes
    const recipes = await Recipe.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ]
    })
    .populate('createdBy', 'name')
    .select('title description image tags createdBy')
    .limit(10);

    // Format results
    const results = [
      ...users.map(user => ({
        type: 'user' as const,
        id: user._id.toString(),
        name: user.name,
        description: user.bio,
        image: user.image,
      })),
      ...recipes.map(recipe => ({
        type: 'recipe' as const,
        id: recipe._id.toString(),
        name: recipe.title,
        description: recipe.description,
        image: recipe.image,
        createdBy: {
          name: recipe.createdBy.name,
        },
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}