'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import Carousel from '@/components/Carousel';
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch';
import { IoSearchOutline, IoPersonCircle, IoBook, IoRestaurant, IoStar, IoEye, IoChatbubbleOutline } from 'react-icons/io5';
import { FaGrinHearts, FaRegGrinHearts } from 'react-icons/fa';
import { getTagsDisplay, getFirstTagByPriority } from '@/utils/tags';

interface SearchResult {
  type: 'user' | 'recipe' | 'cookbook' | 'creation';
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdBy?: {
    _id: string;
    name: string;
    image?: string;
  };
  members?: number;
  recipes?: number;
  likes?: any[];
  comments?: any[];
  tags?: string[];
  cookingTime?: number;
  cuisine?: string;
  averageRating?: number;
  totalRatings?: number;
  createdAt?: string;
}

interface RecommendedChef {
  _id: string;
  name: string;
  image?: string;
  followersCount: number;
  recipesCount: number;
}

interface RecommendedRecipe {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  averageRating?: number;
  totalRatings?: number;
}

interface TrendingCreation {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  createdBy: {
    _id: string;
    name: string;
    image?: string;
  };
  likes?: Array<{ _id: string; name: string; image?: string }>;
  comments?: any[];
  recipes?: {
    recipe: {
      _id: string;
      title: string;
    };
    rating?: number;
  }[];
  createdAt: string;
  score?: number;
}

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendedChefs, setRecommendedChefs] = useState<RecommendedChef[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<RecommendedRecipe[]>([]);
  const [trendingCreations, setTrendingCreations] = useState<TrendingCreation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [yummingStates, setYummingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadRecommendations();
  }, [session, status, router]);

  const loadRecommendations = async () => {
    try {
      // Load recommended chefs
      const chefsResponse = await fetch('/api/users/search?limit=10');
      if (chefsResponse.ok) {
        const chefsData = await chefsResponse.json();
        setRecommendedChefs(chefsData);
      }

      // Load recommended recipes
      const recipesResponse = await fetch('/api/recipes?limit=10');
      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        setRecommendedRecipes(recipesData);
      }

      // Load trending creations
      const trendingResponse = await fetch('/api/creations/trending');
      if (trendingResponse.ok) {
        const trendingData = await trendingResponse.json();
        setTrendingCreations(trendingData);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSearch = async (searchQuery: string, filters?: SearchFilters) => {
    // Check if we have any search criteria (query text or filters)
    const hasFilters = filters?.contentType !== 'all' || 
                      (filters?.tags && filters.tags.length > 0) || 
                      filters?.cookingTime?.min || 
                      filters?.cookingTime?.max || 
                      filters?.cuisine || 
                      filters?.sortBy !== 'relevance';

    if (!searchQuery.trim() && !hasFilters) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        contentType: filters?.contentType || 'all',
        sortBy: filters?.sortBy || 'relevance',
        sortOrder: filters?.sortOrder || 'desc'
      });

      if (filters?.tags?.length) {
        params.append('tags', filters.tags.join(','));
      }
      if (filters?.cookingTime?.min) {
        params.append('cookingTimeMin', filters.cookingTime.min.toString());
      }
      if (filters?.cookingTime?.max) {
        params.append('cookingTimeMax', filters.cookingTime.max.toString());
      }
      if (filters?.cuisine) {
        params.append('cuisine', filters.cuisine);
      }

      const response = await fetch(`/api/search/advanced?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove the automatic search effect since we now use the AdvancedSearch component

  const handleYum = async (creationId: string) => {
    if (yummingStates[creationId]) return;
    
    const currentCreation = trendingCreations.find(creation => creation._id === creationId);
    if (!currentCreation) return;
    
    const userHasYummed = hasYummed(currentCreation);
    const currentUser = { _id: session?.user?.id || '', name: session?.user?.name || '', image: session?.user?.image };
    
    // Optimistic update - update UI immediately
    setTrendingCreations(prev => prev.map(creation => {
      if (creation._id === creationId) {
        const currentLikes = creation.likes || [];
        const newLikes = userHasYummed 
          ? currentLikes.filter(like => like._id !== session?.user?.id)
          : [...currentLikes, currentUser];
        return { ...creation, likes: newLikes };
      }
      return creation;
    }));
    
    setYummingStates(prev => ({ ...prev, [creationId]: true }));
    
    try {
      const response = await fetch(`/api/creations/${creationId}/yum`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh trending creations data
        const trendingResponse = await fetch('/api/creations/trending');
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          setTrendingCreations(trendingData);
        }
      } else {
        // Revert optimistic update on error
        setTrendingCreations(prev => prev.map(creation => {
          if (creation._id === creationId) {
            const currentLikes = creation.likes || [];
            const revertedLikes = userHasYummed 
              ? [...currentLikes, currentUser]
              : currentLikes.filter(like => like._id !== session?.user?.id);
            return { ...creation, likes: revertedLikes };
          }
          return creation;
        }));
      }
    } catch (error) {
      console.error('Error yumming creation:', error);
      // Revert optimistic update on error
      setTrendingCreations(prev => prev.map(creation => {
        if (creation._id === creationId) {
          const currentLikes = creation.likes || [];
          const revertedLikes = userHasYummed 
            ? [...currentLikes, currentUser]
            : currentLikes.filter(like => like._id !== session?.user?.id);
          return { ...creation, likes: revertedLikes };
        }
        return creation;
      }));
    } finally {
      setYummingStates(prev => ({ ...prev, [creationId]: false }));
    }
  };

  const hasYummed = (creation: TrendingCreation) => {
    if (!creation.likes) return false;
    return creation.likes.some(like => like._id === session?.user?.id);
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Explore
          </h1>
          
          <AdvancedSearch 
            onSearch={handleSearch}
            loading={loading}
            initialQuery={query}
          />
        </div>

        {/* Search Results */}
        {results.length > 0 && (
          <div className="mb-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Search Results ({results.length})
                </h2>
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={
                      result.type === 'user' 
                        ? `/profile/${result.id}` 
                        : result.type === 'cookbook'
                        ? `/cookbooks/${result.id}`
                        : result.type === 'creation'
                        ? `/creations/${result.id}`
                        : `/recipes/${result.id}`
                    }
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {result.image ? (
                          <img 
                            src={result.image} 
                            alt={result.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : result.type === 'user' ? (
                          <IoPersonCircle size={30} className="text-gray-400" />
                        ) : result.type === 'cookbook' ? (
                          <IoBook size={24} className="text-gray-400" />
                        ) : (
                          <IoRestaurant size={24} className="text-gray-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {result.name}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                            {result.type === 'user' ? 'Chef' : result.type}
                          </span>
                        </div>
                        
                        {result.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          {result.type === 'recipe' && result.createdBy && (
                            <span>by {result.createdBy.name}</span>
                          )}
                          {result.type === 'creation' && result.createdBy && (
                            <span>by {result.createdBy.name}</span>
                          )}
                          {result.type === 'cookbook' && result.members && (
                            <span>{result.members} members</span>
                          )}
                          {result.type === 'cookbook' && result.recipes && (
                            <span>{result.recipes} recipes</span>
                          )}
                          {result.type === 'creation' && result.likes && (
                            <span>{result.likes.length} yums</span>
                          )}
                          {result.type === 'creation' && result.comments && (
                            <span>{result.comments.length} comments</span>
                          )}
                          {(result.type === 'recipe' || result.type === 'creation') && result.cookingTime && (
                            <span>{result.cookingTime}m</span>
                          )}
                          {result.type === 'recipe' && result.averageRating && result.totalRatings ? (
                            <span>{result.averageRating.toFixed(1)} 🤌 ({result.totalRatings})</span>
                          ) : null}
                          {result.tags && result.tags.length > 0 && (
                            <span className="badge badge-success capitalize">
                              {getFirstTagByPriority(result.tags)?.replace('-', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommendations */}
        {results.length === 0 && (
          <div className="space-y-8">
            {/* Recommended Chefs */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Discover Chefs
              </h2>
              {loadingRecommendations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
                </div>
              ) : (
                <Carousel>
                  {recommendedChefs.map((chef) => (
                    <Link
                      key={chef._id}
                      href={`/profile/${chef._id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center w-72 flex-shrink-0 snap-start"
                    >
                      <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        {chef.image ? (
                          <img 
                            src={chef.image} 
                            alt={chef.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <IoPersonCircle size={40} className="text-gray-400" />
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {chef.name}
                      </h3>
                      <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <IoEye size={14} />
                          {chef.followersCount} followers
                        </span>
                        <span className="flex items-center gap-1">
                          <IoRestaurant size={14} />
                          {chef.recipesCount} recipes
                        </span>
                      </div>
                    </Link>
                  ))}
                </Carousel>
              )}
            </section>

            {/* Recommended Recipes */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Trending Recipes
              </h2>
              {loadingRecommendations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
                </div>
              ) : (
                <Carousel>
                  {recommendedRecipes.map((recipe) => (
                    <Link
                      key={recipe._id}
                      href={`/recipes/${recipe._id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow w-80 flex-shrink-0 snap-start"
                    >
                      {recipe.image && (
                        <div className="aspect-video w-full bg-gray-200 dark:bg-gray-700">
                          <img 
                            src={recipe.image} 
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {recipe.title}
                        </h3>
                        {recipe.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                            {recipe.description}
                          </p>
                        )}
                        {(() => {
                          const firstTag = getFirstTagByPriority(recipe.tags || []);
                          return firstTag ? (
                            <div className="mb-2">
                              <span className="badge badge-success capitalize text-xs">
                                {firstTag.replace('-', ' ')}
                              </span>
                            </div>
                          ) : null;
                        })()}
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>by {recipe.createdBy.name}</span>
                          {recipe.averageRating && recipe.totalRatings ? (
                            <span>
                              {recipe.averageRating.toFixed(1)} 🤌 ({recipe.totalRatings} creation{recipe.totalRatings !== 1 ? 's' : ''})
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </Carousel>
              )}
            </section>

            {/* Trending Creations */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Trending Creations
              </h2>
              {loadingRecommendations ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
                </div>
              ) : (
                <Carousel>
                  {trendingCreations.map((creation) => (
                    <Link
                      key={creation._id}
                      href={`/creations/${creation._id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow w-80 flex-shrink-0 snap-start cursor-pointer"
                    >
                      {/* Header */}
                      <div className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {creation.createdBy.image ? (
                            <img 
                              src={creation.createdBy.image} 
                              alt={creation.createdBy.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                              {creation.createdBy.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                            {creation.createdBy.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(creation.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Image */}
                      {creation.image && (
                        <img 
                          src={creation.image} 
                          alt={creation.title}
                          className="w-full h-48 object-cover hover:opacity-95 transition-opacity"
                        />
                      )}

                      {/* Content */}
                      <div className="p-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm hover:underline">
                          {creation.title}
                        </h4>
                        {creation.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm line-clamp-2">
                            {creation.description}
                          </p>
                        )}
                        
                        {/* Recipe Information */}
                        {creation.recipes && creation.recipes.length > 0 && (
                          <div className="space-y-1 mb-3">
                            {creation.recipes.map((recipeItem, index) => (
                              <div key={index} className="flex items-center gap-1 text-sm">
                                <IoRestaurant size={14} className="text-gray-500 dark:text-gray-400" />
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {recipeItem.recipe.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Yums and Comments - Strava style */}
                        <div className="flex items-center justify-center gap-6 mb-3">
                          {/* Yums with profile pictures */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/creations/${creation._id}/yums`);
                            }}
                            className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                          >
                            {creation.likes && creation.likes.length > 0 ? (
                              <>
                                <div className="flex -space-x-2">
                                  {creation.likes.slice(0, 3).map((user, index) => (
                                    <div 
                                      key={user._id} 
                                      className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center"
                                      style={{ zIndex: 3 - index }}
                                    >
                                      {user.image ? (
                                        <img 
                                          src={user.image} 
                                          alt={user.name}
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                          {user.name.charAt(0).toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  {creation.likes.length} yummed
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                0 yummed
                              </span>
                            )}
                          </button>

                          {/* Comments */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/creations/${creation._id}/comments`);
                            }}
                            className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                          >
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {creation.comments?.length || 0} {(creation.comments?.length || 0) === 1 ? 'comment' : 'comments'}
                            </span>
                          </button>
                        </div>
                        
                        {/* Action buttons - bigger and more inviting */}
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleYum(creation._id);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all text-sm ${
                              hasYummed(creation)
                                ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 dark:hover:border-green-800'
                            }`}
                          >
                            {hasYummed(creation) ? <FaGrinHearts size={16} style={{ color: 'var(--color-primary-600)' }} /> : <FaRegGrinHearts size={16} />}
                            <span>
                              Yum
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              router.push(`/creations/${creation._id}/comments?focus=true`);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all text-sm"
                          >
                            <IoChatbubbleOutline size={16} />
                            <span>
                              Comment
                            </span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </Carousel>
              )}
            </section>
          </div>
        )}

        {/* Empty state when no results */}
        {results.length === 0 && loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        )}
      </main>
    </div>
  );
}