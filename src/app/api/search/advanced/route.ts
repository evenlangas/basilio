import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Recipe from '@/models/Recipe';
import Cookbook from '@/models/Cookbook';
import Creation from '@/models/Creation';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const contentType = searchParams.get('contentType') || 'all';
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
    const cookingTimeMin = searchParams.get('cookingTimeMin');
    const cookingTimeMax = searchParams.get('cookingTimeMax');
    const cuisine = searchParams.get('cuisine');
    const ingredients = searchParams.get('ingredients')?.split(',').filter(Boolean) || [];
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Check if we have any search criteria (query text or filters)
    const hasFilters = contentType !== 'all' || 
                      tags.length > 0 || 
                      cookingTimeMin || 
                      cookingTimeMax || 
                      cuisine || 
                      ingredients.length > 0 || 
                      sortBy !== 'relevance';

    if (!query.trim() && !hasFilters) {
      return NextResponse.json([]);
    }

    const results: any[] = [];
    const searchRegex = query.trim() ? new RegExp(query, 'i') : null;

    // Build sort object
    const getSortObject = (type: string) => {
      let sortObj: any = {};
      
      switch (sortBy) {
        case 'date':
          sortObj = { createdAt: sortOrder === 'desc' ? -1 : 1 };
          break;
        case 'alphabetical':
          if (type === 'user') {
            sortObj = { name: sortOrder === 'desc' ? -1 : 1 };
          } else {
            sortObj = { title: sortOrder === 'desc' ? -1 : 1 };
          }
          break;
        case 'popularity':
          if (type === 'recipe') {
            sortObj = { totalRatings: sortOrder === 'desc' ? -1 : 1 };
          } else if (type === 'creation') {
            sortObj = { 'likes.length': sortOrder === 'desc' ? -1 : 1 };
          }
          break;
        case 'rating':
          if (type === 'recipe') {
            sortObj = { averageRating: sortOrder === 'desc' ? -1 : 1 };
          }
          break;
        default: // relevance
          sortObj = { createdAt: -1 }; // Default to newest first for relevance
      }
      
      return sortObj;
    };

    // Search Users/Chefs
    if (contentType === 'all' || contentType === 'chef') {
      const userQuery: any = {};
      
      // Only add text search if we have a query
      if (searchRegex) {
        userQuery.name = searchRegex;
      }

      const users = await User.find(userQuery)
        .select('name image')
        .sort(getSortObject('user'))
        .limit(20);

      users.forEach(user => {
        results.push({
          type: 'user',
          id: user._id.toString(),
          name: user.name,
          image: user.image,
        });
      });
    }

    // Search Recipes
    if (contentType === 'all' || contentType === 'recipe') {
      const recipeQuery: any = {};

      // Only add text search if we have a query
      if (searchRegex) {
        recipeQuery.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }
      
      // Add ingredients search - require ALL ingredients to be present
      if (ingredients.length > 0) {
        recipeQuery.$and = ingredients.map(ingredient => ({
          'ingredients.name': { $regex: new RegExp(ingredient, 'i') }
        }));
      }

      // Add filters
      if (tags.length > 0) {
        recipeQuery.tags = { $in: tags };
      }
      if (cookingTimeMin || cookingTimeMax) {
        recipeQuery.cookingTime = {};
        if (cookingTimeMin) recipeQuery.cookingTime.$gte = parseInt(cookingTimeMin);
        if (cookingTimeMax) recipeQuery.cookingTime.$lte = parseInt(cookingTimeMax);
      }
      if (cuisine) {
        recipeQuery.cuisine = cuisine;
      }

      const recipes = await Recipe.find(recipeQuery)
        .populate('createdBy', 'name image')
        .sort(getSortObject('recipe'))
        .limit(20);

      recipes.forEach(recipe => {
        results.push({
          type: 'recipe',
          id: recipe._id.toString(),
          name: recipe.title,
          description: recipe.description,
          image: recipe.image,
          createdBy: recipe.createdBy,
          tags: recipe.tags,
          cookingTime: recipe.cookingTime,
          cuisine: recipe.cuisine,
          ingredients: recipe.ingredients,
          averageRating: recipe.averageRating,
          totalRatings: recipe.totalRatings,
          createdAt: recipe.createdAt
        });
      });
    }

    // Search Creations
    if (contentType === 'all' || contentType === 'creation') {
      const creationQuery: any = {};

      // Only add text search if we have a query
      if (searchRegex) {
        creationQuery.$or = [
          { title: searchRegex },
          { description: searchRegex }
        ];
      }

      // Add filters for creations
      if (cookingTimeMin || cookingTimeMax) {
        creationQuery.cookingTime = {};
        if (cookingTimeMin) creationQuery.cookingTime.$gte = parseInt(cookingTimeMin);
        if (cookingTimeMax) creationQuery.cookingTime.$lte = parseInt(cookingTimeMax);
      }

      const creations = await Creation.find(creationQuery)
        .populate('createdBy', 'name image')
        .populate('likes', 'name image')
        .populate('chef', 'name image') // Populate new chef field
        .populate('eatenWithUsers', 'name image') // Populate new eatenWith field
        .populate('comments')
        .sort(getSortObject('creation'))
        .limit(20);

      creations.forEach(creation => {
        results.push({
          type: 'creation',
          id: creation._id.toString(),
          name: creation.title,
          description: creation.description,
          image: creation.image,
          createdBy: creation.createdBy,
          likes: creation.likes,
          comments: creation.comments,
          cookingTime: creation.cookingTime,
          createdAt: creation.createdAt
        });
      });
    }

    // Search Cookbooks
    if (contentType === 'all' || contentType === 'cookbook') {
      const cookbookQuery: any = {
        isPrivate: false // Only search public cookbooks
      };

      // Only add text search if we have a query
      if (searchRegex) {
        cookbookQuery.$or = [
          { name: searchRegex },
          { description: searchRegex }
        ];
      }

      const cookbooks = await Cookbook.find(cookbookQuery)
        .populate('createdBy', 'name image')
        .populate('recipes')
        .populate('invitedUsers', 'name')
        .sort(getSortObject('cookbook'))
        .limit(20);

      cookbooks.forEach(cookbook => {
        results.push({
          type: 'cookbook',
          id: cookbook._id.toString(),
          name: cookbook.name,
          description: cookbook.description,
          image: cookbook.image,
          createdBy: cookbook.createdBy,
          recipes: cookbook.recipes?.length || 0,
          members: (cookbook.invitedUsers?.length || 0) + 1, // +1 for the owner
          createdAt: cookbook.createdAt
        });
      });
    }

    // Sort results by relevance if that's the selected sort
    if (sortBy === 'relevance') {
      results.sort((a, b) => {
        // If we have a query, prioritize exact matches in titles
        if (query.trim()) {
          const aExactMatch = a.name.toLowerCase().includes(query.toLowerCase());
          const bExactMatch = b.name.toLowerCase().includes(query.toLowerCase());
          
          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;
        }
        
        // Then sort by creation date (newest first)
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in advanced search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}