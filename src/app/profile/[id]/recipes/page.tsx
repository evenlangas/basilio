'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { RecipeGridSkeleton } from '@/components/SkeletonLoader';
import { 
  IoArrowBack,
  IoBook, 
  IoRestaurant, 
  IoTime
} from 'react-icons/io5';
import { getCountryByCode } from '@/utils/countries';
import { getTagsDisplay, getFirstTagByPriority } from '@/utils/tags';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: { name: string; amount: string; unit: string }[];
  instructions: { step: number; description: string }[];
  cookingTime: number;
  servings: number;
  url: string;
  image: string;
  cuisine?: string;
  mealType?: string;
  createdBy: { _id: string; name: string };
  createdAt: string;
  averageRating: number;
  totalRatings: number;
  tags?: string[];
}

interface UserProfile {
  _id: string;
  name: string;
  isPrivate: boolean;
}

export default function UserRecipesPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setUserId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !userId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchUser();
    fetchRecipes();
  }, [session, status, router, userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchRecipes = async () => {
    try {
      // Use different API endpoint if viewing own recipes
      const isOwnProfile = session?.user?.id === userId;
      const endpoint = isOwnProfile ? '/api/recipes' : `/api/user/${userId}/recipes`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton h-10 w-10 rounded-lg" />
            <div className="skeleton h-8 w-48" />
          </div>
          <RecipeGridSkeleton count={6} />
        </main>
      </div>
    );
  }

  if (!session || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <IoArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {session?.user?.id === userId ? 'My Recipes' : `${user.name}'s Recipes`}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <IoBook className="text-4xl text-gray-400" size={48} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No recipes found' : session?.user?.id === userId ? 'No recipes yet' : user.isPrivate ? 'Private Profile' : 'No recipes yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : session?.user?.id === userId
                ? 'Start building your cookbook by adding your first recipe'
                : user.isPrivate
                ? 'This user\'s recipes are private'
                : `${user.name} hasn't created any recipes yet`
              }
            </p>
            {!searchTerm && session?.user?.id === userId && (
              <Link
                href="/recipes/new"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Add Your First Recipe
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipes/${recipe._id}`}
                className="recipe-card card"
              >
                {recipe.image ? (
                  <div className="h-40 sm:h-48 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="recipe-image"
                    />
                  </div>
                ) : (
                  <div className="h-40 sm:h-48 flex items-center justify-center" style={{backgroundColor: 'var(--color-bg-tertiary)'}}>
                    <div className="text-center" style={{color: 'var(--color-text-tertiary)'}}>
                      <div className="text-3xl sm:text-4xl mb-2">
                        <IoRestaurant size={40} />
                      </div>
                      <div className="text-xs sm:text-sm">No image</div>
                    </div>
                  </div>
                )}
                <div className="recipe-content">
                  <h3 className="recipe-title">
                    {recipe.title}
                  </h3>
                  
                  {recipe.description && (
                    <p className="recipe-description">
                      {recipe.description}
                    </p>
                  )}
                  
                  <div className="recipe-meta">
                    <span className="flex items-center">
                      <IoTime className="mr-1" size={16} />
                      {recipe.cookingTime || 0}m
                    </span>
                    {recipe.totalRatings && recipe.totalRatings > 0 ? (
                      <span>
                        {recipe.averageRating.toFixed(1)} 🤌 ({recipe.totalRatings} creation{recipe.totalRatings !== 1 ? 's' : ''})
                      </span>
                    ) : (
                      <span className="text-gray-400">No ratings yet</span>
                    )}
                  </div>
                  
                  {(() => {
                    const firstTag = getFirstTagByPriority(recipe.tags || []);
                    const hasContent = (recipe.cuisine && getCountryByCode(recipe.cuisine)) || firstTag;
                    
                    return hasContent ? (
                      <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        {recipe.cuisine && getCountryByCode(recipe.cuisine) && (
                          <span className="text-lg" title={getCountryByCode(recipe.cuisine)?.name}>
                            {getCountryByCode(recipe.cuisine)?.flag}
                          </span>
                        )}
                        {firstTag && (
                          <span className="badge badge-success capitalize">
                            {firstTag.replace('-', ' ')}
                          </span>
                        )}
                      </div>
                    ) : null;
                  })()}
                  
                  <div className="flex items-center justify-between" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)'}}>
                    <span className="truncate mr-2">
                      {recipe.createdBy.name}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}