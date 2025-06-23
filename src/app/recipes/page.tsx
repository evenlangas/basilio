'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌿</div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {session.user.familyId ? 'Family Recipes' : 'My Recipes'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your{' '}
              {session.user.familyId ? 'family' : 'personal'} cookbook
            </p>
            {!session.user.familyId && (
              <p className="text-xs sm:text-sm text-blue-600 mt-1">
                💡 <Link href="/family" className="underline hover:text-blue-800">Join or create a family</Link> to share recipes with others!
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
            <Link
              href="/shopping"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <span>🛒</span>
              <span>Shopping List</span>
            </Link>
            <Link
              href="/recipes/new"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors text-center"
            >
              Add Recipe
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No recipes found' : 'No recipes yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRecipes.map((recipe) => (
              <Link
                key={recipe._id}
                href={`/recipes/${recipe._id}`}
                className="recipe-card bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                {recipe.image ? (
                  <div className="h-40 sm:h-48 overflow-hidden">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="recipe-image w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 sm:h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center text-gray-400 dark:text-gray-500">
                      <div className="text-3xl sm:text-4xl mb-2">🍽️</div>
                      <div className="text-xs sm:text-sm">No image</div>
                    </div>
                  </div>
                )}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 line-clamp-2">
                    {recipe.title}
                  </h3>
                  
                  {recipe.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3 text-sm sm:text-base">
                      {recipe.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4">
                    <span>⏱️ {recipe.cookingTime || 0}m</span>
                    <span>👥 {recipe.servings || 1}</span>
                  </div>
                  
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {recipe.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{recipe.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
                    <span className="truncate mr-2">
                      {recipe.createdBy.name}
                    </span>
                    {recipe.familyId && (
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs flex-shrink-0">
                        👨‍👩‍👧‍👦
                      </span>
                    )}
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