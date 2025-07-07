'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { IoSearchOutline, IoPersonCircle, IoBook, IoRestaurant, IoStar, IoEye } from 'react-icons/io5';
import { getTagsDisplay } from '@/utils/tags';

interface SearchResult {
  type: 'user' | 'recipe' | 'cookbook';
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdBy?: {
    name: string;
  };
  members?: number;
  recipes?: number;
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

export default function ExplorePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendedChefs, setRecommendedChefs] = useState<RecommendedChef[]>([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState<RecommendedRecipe[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);

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
      const chefsResponse = await fetch('/api/users/search?limit=6');
      if (chefsResponse.ok) {
        const chefsData = await chefsResponse.json();
        setRecommendedChefs(chefsData);
      }

      // Load recommended recipes
      const recipesResponse = await fetch('/api/recipes?limit=6');
      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        setRecommendedRecipes(recipesData);
      }
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

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
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IoSearchOutline size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for chefs, recipes, or cookbooks..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                '--tw-ring-color': 'var(--color-primary-500)',
                'focusRingColor': 'var(--color-primary-500)'
              } as React.CSSProperties}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary-500)';
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-500)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.boxShadow = '';
              }}
            />
          </div>
        </div>

        {/* Search Results */}
        {query && (
          <div className="mb-8">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  No results found for "{query}"
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Search Results
                </h2>
                {results.map((result) => (
                  <Link
                    key={`${result.type}-${result.id}`}
                    href={
                      result.type === 'user' 
                        ? `/profile/${result.id}` 
                        : result.type === 'cookbook'
                        ? `/cookbooks/${result.id}`
                        : `/recipes/${result.id}`
                    }
                    className="block bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
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
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            {result.type === 'user' ? 'Chef' : result.type === 'cookbook' ? 'Cookbook' : 'Recipe'}
                          </span>
                        </div>
                        
                        {result.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {result.type === 'recipe' && result.createdBy && (
                            <span>by {result.createdBy.name}</span>
                          )}
                          {result.type === 'cookbook' && result.members && (
                            <span>{result.members} members</span>
                          )}
                          {result.type === 'cookbook' && result.recipes && (
                            <span>{result.recipes} recipes</span>
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
        {!query && (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedChefs.map((chef) => (
                    <Link
                      key={chef._id}
                      href={`/profile/${chef._id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center"
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
                </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedRecipes.map((recipe) => (
                    <Link
                      key={recipe._id}
                      href={`/recipes/${recipe._id}`}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
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
                        {recipe.tags && recipe.tags.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm" title={recipe.tags.join(', ')}>
                              {getTagsDisplay(recipe.tags)}
                            </span>
                          </div>
                        )}
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
                </div>
              )}
            </section>
          </div>
        )}

        {/* Empty state when no query */}
        {!query && !loadingRecommendations && recommendedChefs.length === 0 && recommendedRecipes.length === 0 && (
          <div className="text-center py-12">
            <IoSearchOutline size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Discover new content
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Search for chefs, recipes, and cookbooks to find new inspiration
            </p>
          </div>
        )}
      </main>
    </div>
  );
}