import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Recipe from '@/models/Recipe';
import User from '@/models/User';

// Configuration for scalability
const SEARCH_CONFIG = {
  MAX_RESULTS_PER_REQUEST: 50,        // Limit results to prevent large payloads
  USER_RECIPES_LIMIT: 10,             // Max user's own recipes to show
  OTHER_RECIPES_LIMIT: 40,            // Max other users' recipes to show
  MIN_SEARCH_LENGTH: 1,               // Minimum search query length (1 character)
  DEBOUNCE_SAFE_LENGTH: 2,            // Length where search becomes more efficient
  MAX_SEARCH_LENGTH: 100,             // Prevent extremely long search queries
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(SEARCH_CONFIG.MAX_RESULTS_PER_REQUEST, 
                          parseInt(searchParams.get('limit') || '20'));

    // Validate search query
    if (query.length > SEARCH_CONFIG.MAX_SEARCH_LENGTH) {
      return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
    }

    await dbConnect();
    
    const user = await User.findOne({ email: session.user.email }).select('_id');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = user._id;
    const results = [];

    // For very short queries, return minimal results to avoid expensive operations
    if (query.length > 0 && query.length < SEARCH_CONFIG.MIN_SEARCH_LENGTH) {
      return NextResponse.json({ recipes: [], pagination: { total: 0 } });
    }

    // Build search conditions
    let searchConditions = {};
    
    if (query.trim()) {
      const searchRegex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      
      // Always use regex search for compatibility with existing recipes
      // This works with or without text indexes
      searchConditions = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      };
    }

    // Get user's own recipes first (highest priority)
    const userRecipePromise = Recipe.find({
      ...searchConditions,
      createdBy: userId
    })
    .select('title description image tags cookingTime servings averageRating totalRatings createdBy')
    .populate('createdBy', 'name image')
    .sort({ createdAt: -1 })  // Sort by date - works with all recipes
    .limit(SEARCH_CONFIG.USER_RECIPES_LIMIT)
    .lean(); // Use lean() for better performance

    // Get other public recipes (lower priority)
    const otherRecipePromise = Recipe.find({
      ...searchConditions,
      createdBy: { $ne: userId },
      isPrivate: { $ne: true }
    })
    .select('title description image tags cookingTime servings averageRating totalRatings createdBy')
    .populate('createdBy', 'name image')
    .sort({ averageRating: -1, totalRatings: -1, createdAt: -1 })  // Sort by popularity then date
    .limit(SEARCH_CONFIG.OTHER_RECIPES_LIMIT)
    .lean(); // Use lean() for better performance

    // Execute queries in parallel for better performance
    const [userRecipes, otherRecipes] = await Promise.all([
      userRecipePromise,
      otherRecipePromise
    ]);

    // Format user's recipes
    const formattedUserRecipes = userRecipes.map(recipe => ({
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description || '',
      image: recipe.image || '',
      tags: recipe.tags || [],
      cookingTime: recipe.cookingTime || 0,
      servings: recipe.servings || 1,
      averageRating: recipe.averageRating || 0,
      totalRatings: recipe.totalRatings || 0,
      createdBy: {
        _id: recipe.createdBy._id.toString(),
        name: recipe.createdBy.name,
        image: recipe.createdBy.image || '',
      },
      isOwn: true,
      relevanceScore: recipe.score || 0, // For debugging/analytics
    }));

    // Format other recipes
    const formattedOtherRecipes = otherRecipes.map(recipe => ({
      _id: recipe._id.toString(),
      title: recipe.title,
      description: recipe.description || '',
      image: recipe.image || '',
      tags: recipe.tags || [],
      cookingTime: recipe.cookingTime || 0,
      servings: recipe.servings || 1,
      averageRating: recipe.averageRating || 0,
      totalRatings: recipe.totalRatings || 0,
      createdBy: {
        _id: recipe.createdBy._id.toString(),
        name: recipe.createdBy.name,
        image: recipe.createdBy.image || '',
      },
      isOwn: false,
      relevanceScore: recipe.score || 0, // For debugging/analytics
    }));

    // Combine results with user's recipes first
    const allResults = [...formattedUserRecipes, ...formattedOtherRecipes];

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = allResults.slice(startIndex, endIndex);

    // Return results with metadata for pagination
    return NextResponse.json({
      recipes: paginatedResults,
      pagination: {
        page,
        limit,
        total: allResults.length,
        hasMore: endIndex < allResults.length,
        userRecipesCount: formattedUserRecipes.length,
        otherRecipesCount: formattedOtherRecipes.length,
      },
      searchQuery: query,
      processingTime: Date.now(), // For performance monitoring
    });

  } catch (error) {
    console.error('Error searching recipes:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}