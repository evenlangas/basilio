'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { RecipeGridSkeleton } from '@/components/SkeletonLoader';
import { 
  IoBulb, 
  IoCart, 
  IoBook, 
  IoRestaurant, 
  IoTime, 
  IoPeople,
  IoAdd
} from 'react-icons/io5';

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
        
        {/* Floating Add Button Skeleton */}
        <div className="skeleton floating-add-button" />
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
              {session.user.familyId ? 'Family Recipes' : 'My Recipes'}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your{' '}
              {session.user.familyId ? 'family' : 'personal'} cookbook
            </p>
            {!session.user.familyId && (
              <p className="text-sm text-blue-600 mt-2 flex items-center gap-1 justify-center sm:justify-start">
                <IoBulb size={14} /> <Link href="/family" className="underline hover:text-blue-800">Join or create a family</Link> to share recipes with others!
              </p>
            )}
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
                  
                  {recipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                      {recipe.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="badge badge-success"
                        >
                          {tag}
                        </span>
                      ))}
                      {recipe.tags.length > 2 && (
                        <span style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)'}}>
                          +{recipe.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)'}}>
                    <span className="truncate mr-2">
                      {recipe.createdBy.name}
                    </span>
                    {recipe.familyId && (
<span className="badge badge-secondary">
                        <IoPeople size={16} />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      {/* Floating Add Button */}
      <Link
        href="/recipes/new"
        className="floating-add-button"
        title="Add New Recipe"
      >
        <IoAdd size={28} />
      </Link>
    </div>
  );
}