'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Toast from '@/components/Toast';
import { RecipeDetailSkeleton } from '@/components/SkeletonLoader';
import { 
  IoSadOutline, 
  IoLink, 
  IoTime, 
  IoPeople, 
  IoPerson, 
  IoCart,
  IoBook,
  IoPersonCircle 
} from 'react-icons/io5';
import { getCountryByCode } from '@/utils/countries';

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
  recommendedDrinks?: string;
  mealType?: string;
  cuisine?: string;
  createdBy: { _id: string; name: string; image?: string };
  originalRecipe?: { _id: string; title: string };
  originalChef?: { _id: string; name: string; image?: string };
  copiedBy?: { _id: string; name: string; image?: string };
  isReference?: boolean;
  isPrivate?: boolean;
  createdAt: string;
  averageRating: number;
  totalRatings: number;
  ratings: Array<{
    user: { _id: string; name: string; image?: string };
    rating: number;
    creation: { _id: string; title: string };
    createdAt: string;
  }>;
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
  const [cookbooks, setCookbooks] = useState<any[]>([]);
  const [shoppingLists, setShoppingLists] = useState<any[]>([]);
  const [showCookbookDropdown, setShowCookbookDropdown] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const [addingToCookbook, setAddingToCookbook] = useState(false);
  const [selectedCookbookId, setSelectedCookbookId] = useState<string>('');
  const [showCopyTypeModal, setShowCopyTypeModal] = useState(false);
  const [creations, setCreations] = useState<any[]>([]);
  const [loadingCreations, setLoadingCreations] = useState(false);

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
    loadCookbooks();
    loadShoppingLists();
    loadCreations();
  }, [session, status, router, recipeId]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCookbookDropdown(false);
        setShowListDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const loadCookbooks = async () => {
    try {
      const response = await fetch('/api/cookbooks');
      if (response.ok) {
        const data = await response.json();
        setCookbooks(data);
      }
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  const loadShoppingLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists');
      if (response.ok) {
        const data = await response.json();
        setShoppingLists(data);
      }
    } catch (error) {
      console.error('Error loading shopping lists:', error);
    }
  };

  const loadCreations = async () => {
    if (!recipeId) return;
    setLoadingCreations(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}/creations`);
      if (response.ok) {
        const data = await response.json();
        setCreations(data);
      }
    } catch (error) {
      console.error('Error loading creations:', error);
    } finally {
      setLoadingCreations(false);
    }
  };

  const renderPinchedFingers = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const isSelected = i < rating;
      return (
        <span 
          key={i} 
          className={`inline-block transition-all ${
            isSelected ? 'opacity-100' : 'opacity-30'
          }`}
          style={{
            filter: isSelected ? 'hue-rotate(0deg) saturate(1.2)' : 'grayscale(80%)'
          }}
        >
          🤌
        </span>
      );
    });
  };

  const addToCookbook = async (cookbookId: string, copyType: 'copy' | 'reference') => {
    if (!recipe) return;
    
    setAddingToCookbook(true);
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeId: recipe._id,
          copyType: copyType,
        }),
      });

      if (response.ok) {
        setToast({ 
          message: 'Recipe added to cookbook successfully!', 
          type: 'success', 
          show: true 
        });
        setShowCookbookDropdown(false);
        setShowCopyTypeModal(false);
      } else {
        const errorData = await response.json();
        setToast({ 
          message: errorData.error || 'Failed to add recipe to cookbook', 
          type: 'error', 
          show: true 
        });
      }
    } catch (error) {
      console.error('Error adding to cookbook:', error);
      setToast({ 
        message: 'An error occurred while adding recipe to cookbook', 
        type: 'error', 
        show: true 
      });
    } finally {
      setAddingToCookbook(false);
    }
  };

  const showCopyTypeModalHandler = (cookbookId: string) => {
    setSelectedCookbookId(cookbookId);
    setShowCopyTypeModal(true);
    setShowCookbookDropdown(false);
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

  const addToShoppingList = async (listId: string) => {
    if (!recipe) return;
    
    setAddingToList(true);
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/add-recipe`, {
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
        setShowListDropdown(false);
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
      <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
        <Navigation />
        
        <main className="container container-sm" style={{paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)'}}>
          <RecipeDetailSkeleton />
        </main>
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

  // Allow editing if user is the creator
  const canEdit = recipe.createdBy._id === session.user.id;

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
                  {recipe.totalRatings > 0 ? (
                    <Link 
                      href={`/recipes/${recipeId}/creations`}
                      className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer"
                    >
                      <div className="flex mr-2">
                        {renderPinchedFingers(Math.round(recipe.averageRating))}
                      </div>
                      <span>{recipe.averageRating.toFixed(1)} ({recipe.totalRatings} rating{recipe.totalRatings !== 1 ? 's' : ''})</span>
                    </Link>
                  ) : (
                    <span className="text-gray-400">No ratings yet</span>
                  )}
                  <Link 
                    href={`/profile/${recipe.createdBy._id}`}
                    className="flex items-center hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {recipe.createdBy.image ? (
                      <img 
                        src={recipe.createdBy.image} 
                        alt={recipe.createdBy.name}
                        className="w-5 h-5 rounded-full mr-2 object-cover"
                      />
                    ) : (
                      <IoPersonCircle className="mr-2 text-gray-500" size={20} />
                    )}
                    {recipe.createdBy.name}
                  </Link>
                </div>

                {/* Attribution Section - only for copies, not references */}
                {recipe.originalRecipe && recipe.originalChef && !recipe.isReference && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <IoLink className="mt-0.5 text-green-600 dark:text-green-400" size={16} />
                      <div className="text-sm">
                        <p className="text-green-800 dark:text-green-200 font-medium">
                          Copied from: 
                          <Link 
                            href={`/recipes/${recipe.originalRecipe._id}`}
                            className="ml-1 underline hover:no-underline"
                          >
                            {recipe.originalRecipe.title}
                          </Link>
                        </p>
                        <p className="text-green-700 dark:text-green-300 mt-1">
                          Original chef: {recipe.originalChef.name}
                          {recipe.copiedBy && recipe.copiedBy._id !== recipe.createdBy._id && (
                            <span> • Copied by: {recipe.copiedBy.name}</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                <div className="flex items-center gap-4 mb-4 text-sm">
                  {(recipe.cuisine && getCountryByCode(recipe.cuisine)) || recipe.mealType ? (
                    <div className="flex items-center gap-3">
                      {recipe.cuisine && getCountryByCode(recipe.cuisine) && (
                        <span className="text-2xl" title={getCountryByCode(recipe.cuisine)?.name}>
                          {getCountryByCode(recipe.cuisine)?.flag}
                        </span>
                      )}
                      {recipe.mealType && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-medium capitalize">
                          {recipe.mealType}
                        </span>
                      )}
                    </div>
                  ) : null}
                  {recipe.recommendedDrinks && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Recommended Drinks:</span>
                      <span className="ml-2 text-gray-600 dark:text-gray-400">{recipe.recommendedDrinks}</span>
                    </div>
                  )}
                </div>
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
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 relative">
                      {/* Shopping List Dropdown */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => {
                            setShowListDropdown(!showListDropdown);
                            setShowCookbookDropdown(false);
                          }}
                          disabled={addingToList}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 w-full sm:w-auto"
                        >
                          <IoCart size={18} />
                          <span>Add to List</span>
                        </button>
                        
                        {showListDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-2 max-h-64 overflow-y-auto">
                              {shoppingLists.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                                  No shopping lists found
                                </p>
                              ) : (
                                shoppingLists.map((list) => (
                                  <button
                                    key={list._id}
                                    onClick={() => addToShoppingList(list._id)}
                                    disabled={addingToList}
                                    className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {list.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {list.items.length} items
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Cookbook Dropdown */}
                      <div className="relative dropdown-container">
                        <button
                          onClick={() => {
                            setShowCookbookDropdown(!showCookbookDropdown);
                            setShowListDropdown(false);
                          }}
                          disabled={addingToCookbook}
                          className="text-white px-3 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-1 w-full sm:w-auto"
                          style={{ backgroundColor: 'var(--color-primary-600)' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
                        >
                          <IoBook size={18} />
                          <span>Add to Cookbook</span>
                        </button>
                        
                        {showCookbookDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-2 max-h-64 overflow-y-auto">
                              {cookbooks.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">
                                  No cookbooks found
                                </p>
                              ) : (
                                cookbooks.map((cookbook) => (
                                  <button
                                    key={cookbook._id}
                                    onClick={() => showCopyTypeModalHandler(cookbook._id)}
                                    disabled={addingToCookbook}
                                    className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                                      {cookbook.name}
                                    </div>
                                    {cookbook.description && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {cookbook.description}
                                      </div>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
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

            {/* Creations using this recipe */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  Creations using this recipe ({creations.length})
                </h2>
                {creations.length > 0 && (
                  <Link
                    href={`/recipes/${recipeId}/creations`}
                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                  >
                    View all →
                  </Link>
                )}
              </div>
              
              {loadingCreations ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                </div>
              ) : creations.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">
                    No creations using this recipe yet. Be the first to share your creation!
                  </p>
                  <Link
                    href="/create"
                    className="inline-block mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Share Your Creation
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creations.slice(0, 6).map((creation: any) => (
                    <Link key={creation._id} href={`/creations/${creation._id}`}>
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700">
                        {creation.image && (
                          <img
                            src={creation.image}
                            alt={creation.title}
                            className="w-full h-32 object-cover"
                          />
                        )}
                        <div className="p-3">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">
                            {creation.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>by {creation.createdBy.name}</span>
                            {creation.recipeRating && (
                              <div className="flex items-center gap-1">
                                <div className="flex">
                                  {renderPinchedFingers(creation.recipeRating)}
                                </div>
                                <span>({creation.recipeRating})</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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

        {/* Copy Type Modal */}
        {showCopyTypeModal && (
          <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  How would you like to add this recipe?
                </h3>
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => addToCookbook(selectedCookbookId, 'copy')}
                    disabled={addingToCookbook}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      Copy Recipe
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Create a new copy that you can edit independently
                    </div>
                  </button>
                  <button
                    onClick={() => addToCookbook(selectedCookbookId, 'reference')}
                    disabled={addingToCookbook}
                    className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      Add Reference
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Link to the original recipe (changes will be reflected)
                    </div>
                  </button>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCopyTypeModal(false)}
                    disabled={addingToCookbook}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}