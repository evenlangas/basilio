'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';
import { 
  IoSadOutline, 
  IoLink, 
  IoTime, 
  IoPeople, 
  IoPerson, 
  IoCart 
} from 'react-icons/io5';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Instruction {
  step: number;
  description: string;
}

interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  cookingTime: number;
  servings: number;
  url: string;
  image: string;
  tags: string[];
  createdBy: { _id: string; name: string };
  createdAt: string;
}

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToList, setAddingToList] = useState(false);
  const [servings, setServings] = useState<number>(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; show: boolean }>({
    message: '',
    type: 'success',
    show: false,
  });
  const [recipeId, setRecipeId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setRecipeId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !recipeId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchRecipe();
  }, [session, status, router, recipeId]);

  const fetchRecipe = async () => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const data = await response.json();
        setRecipe(data);
        setServings(data.servings || 1);
      } else if (response.status === 404) {
        setError('Recipe not found');
      } else {
        setError('Failed to load recipe');
      }
    } catch (error) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async () => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/recipes');
      } else {
        alert('Failed to delete recipe');
      }
    } catch (error) {
      alert('An error occurred while deleting the recipe');
    }
  };

  const addToShoppingList = async () => {
    if (!recipe) return;
    
    setAddingToList(true);
    try {
      const response = await fetch('/api/shopping-lists/add-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: recipe._id,
          servings: servings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let message = '';
        
        if (data.combinedCount > 0 && data.addedCount > 0) {
          message = `Added ${data.addedCount} new ingredients and increased quantities for ${data.combinedCount} existing ones!`;
        } else if (data.combinedCount > 0) {
          message = `Updated quantities for ${data.combinedCount} existing ingredients in your shopping list!`;
        } else {
          message = `Added ${data.addedCount} ingredients to your shopping list!`;
        }
        setToast({ message, type: 'success', show: true });
      } else {
        const errorData = await response.json();
        setToast({ 
          message: errorData.error || 'Failed to add ingredients to shopping list', 
          type: 'error', 
          show: true 
        });
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      setToast({ 
        message: 'An error occurred while adding ingredients to shopping list', 
        type: 'error', 
        show: true 
      });
    } finally {
      setAddingToList(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <div className="loading-spinner mx-auto w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          </div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="mb-4">
              <IoSadOutline className="text-gray-400 dark:text-gray-500" size={64} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{error}</h2>
            <button
              onClick={() => router.push('/recipes')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Recipes
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!recipe) return null;

  // Allow editing if user is the creator OR if recipe belongs to user's family
  const canEdit = recipe.createdBy._id === session.user.id || 
                  (session.user.familyId && recipe.familyId === session.user.familyId);

  return (
    <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
      <Navigation />
      
      <Toast
        message={toast.message}
        type={toast.type}
        show={toast.show}
        onClose={() => setToast({ ...toast, show: false })}
      />
      
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mx-2 sm:mx-0">
          {recipe.image && (
            <div className="h-64 md:h-80 overflow-hidden">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {recipe.title}
                </h1>
                
                {recipe.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{recipe.description}</p>
                )}

                {recipe.url && (
                  <div className="mb-4">
                    <a
                      href={recipe.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                    >
                      <IoLink className="mr-1" size={19} />
                      View Original Recipe
                      <span className="ml-1">↗</span>
                    </a>
                  </div>
                )}
                
                <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <IoTime className="mr-1 text-gray-500" size={18} />
                    {recipe.cookingTime || 0} minutes
                  </div>
                  <div className="flex items-center">
                    <IoPeople className="mr-1 text-gray-500" size={18} />
                    {recipe.servings || 1} serving{recipe.servings !== 1 ? 's' : ''}
                  </div>
                  <div className="flex items-center">
                    <IoPerson className="mr-1 text-gray-500" size={18} />
                    {recipe.createdBy.name}
                  </div>
                </div>

                {recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {recipe.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-3 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              {canEdit && (
                <div className="flex space-x-2 sm:ml-4 mt-4 sm:mt-0">
                  <button
                    onClick={() => router.push(`/recipes/${recipeId}/edit`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={deleteRecipe}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 p-4 sm:p-6">
            <div>
              <div className="mb-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-0 text-gray-900 dark:text-gray-100">Ingredients</h2>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Servings:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={servings}
                        onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <button
                      onClick={addToShoppingList}
                      disabled={addingToList}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 w-full sm:w-auto"
                    >
                      <IoCart size={18} />
                      <span>{addingToList ? 'Adding...' : 'Add to List'}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => {
                  const originalServings = recipe.servings || 1;
                  const multiplier = servings / originalServings;
                  
                  let displayAmount = ingredient.amount;
                  if (multiplier !== 1 && ingredient.amount) {
                    const num = parseFloat(ingredient.amount);
                    if (!isNaN(num)) {
                      const adjusted = num * multiplier;
                      displayAmount = adjusted % 1 === 0 ? adjusted.toString() : adjusted.toFixed(2);
                    }
                  }
                  
                  return (
                    <div key={index} className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <span>
                        <strong>
                          {displayAmount} {ingredient.unit}
                          {multiplier !== 1 && (
                            <span className="text-green-600 text-xs ml-1">
                              (adjusted)
                            </span>
                          )}
                        </strong> {ingredient.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Instructions</h2>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full flex items-center justify-center text-sm font-medium mr-4 flex-shrink-0">
                      {instruction.step}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {instruction.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-600 dark:text-gray-400 space-y-2 sm:space-y-0">
              <span>
                Created on {new Date(recipe.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => router.push('/recipes')}
                className="text-green-600 hover:text-green-700 font-medium text-left sm:text-right"
              >
                ← Back to Recipes
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}