import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import Cookbook from '@/models/Cookbook';

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
    Recipe;
    Cookbook;
    
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

    // Search cookbooks
    const cookbooks = await Cookbook.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
    .populate('createdBy', 'name')
    .populate('invitedUsers', 'name')
    .select('name description image createdBy invitedUsers recipes')
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
      ...cookbooks.map(cookbook => ({
        type: 'cookbook' as const,
        id: cookbook._id.toString(),
        name: cookbook.name,
        description: cookbook.description,
        image: cookbook.image,
        createdBy: {
          name: cookbook.createdBy.name,
        },
        members: (cookbook.invitedUsers?.length || 0) + 1, // +1 for creator
        recipes: cookbook.recipes?.length || 0,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}