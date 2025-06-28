'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { RecipeGridSkeleton } from '@/components/SkeletonLoader';
import { 
  IoBook, 
  IoRestaurant, 
  IoTime, 
  IoPeople
} from 'react-icons/io5';
import { getCountryByCode } from '@/utils/countries';

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
  tags: string[];
  cuisine?: string;
  mealType?: string;
  createdBy: { _id: string; name: string };
  createdAt: string;
}

export default function RecipesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchRecipes();
  }, [session, status, router]);

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes');
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
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0 text-center sm:text-left">
              <div className="skeleton h-10 mb-4 mx-auto sm:mx-0" style={{width: '300px'}} />
              <div className="skeleton h-6 mx-auto sm:mx-0" style={{width: '400px'}} />
            </div>
          </div>

          <div className="mb-6">
            <div className="skeleton h-10" style={{maxWidth: '384px'}} />
          </div>

          <RecipeGridSkeleton count={6} />
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Recipes
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} created by you
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
              {searchTerm ? 'No recipes found' : 'No recipes yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Start building your cookbook by adding your first recipe'
              }
            </p>
            {!searchTerm && (
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
                    <span className="flex items-center">
                      <IoPeople className="mr-1" size={16} />
                      {recipe.servings || 1}
                    </span>
                  </div>
                  
                  {(recipe.cuisine && getCountryByCode(recipe.cuisine)) || recipe.mealType ? (
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                      {recipe.cuisine && getCountryByCode(recipe.cuisine) && (
                        <span className="text-lg" title={getCountryByCode(recipe.cuisine)?.name}>
                          {getCountryByCode(recipe.cuisine)?.flag}
                        </span>
                      )}
                      {recipe.mealType && (
                        <span className="badge badge-success capitalize">
                          {recipe.mealType}
                        </span>
                      )}
                    </div>
                  ) : null}
                  
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