'use client';

import { useState, useEffect, useRef } from 'react';
import { IoBook, IoClose, IoTime, IoPeople, IoPersonCircle } from 'react-icons/io5';

interface Recipe {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  cookingTime?: number;
  servings?: number;
  averageRating?: number;
  totalRatings?: number;
  createdBy: {
    _id: string;
    name: string;
    image?: string;
  };
  isOwn: boolean;
}

interface RecipeSearchInputProps {
  value: string;
  onChange: (recipeId: string) => void;
  placeholder?: string;
  label?: string;
}

export default function RecipeSearchInput({ 
  value, 
  onChange, 
  placeholder = "Search for any recipe...", 
  label = "Link to Recipe"
}: RecipeSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected recipe when value changes
  useEffect(() => {
    if (value && recipes.length > 0) {
      const recipe = recipes.find(r => r._id === value);
      if (recipe) {
        setSelectedRecipe(recipe);
        setSearchQuery(recipe.title);
      }
    } else if (!value && selectedRecipe) {
      setSelectedRecipe(null);
      setSearchQuery('');
    }
  }, [value, recipes, selectedRecipe]);

  // Load initial recipes (user's recipes) on mount
  useEffect(() => {
    loadInitialRecipes();
  }, []);

  const loadInitialRecipes = async () => {
    try {
      const response = await fetch('/api/recipes/search?limit=20');
      if (response.ok) {
        const data = await response.json();
        // Handle new API response format
        setRecipes(data.recipes || data);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for recipes
  useEffect(() => {
    // Don't search if user has selected a recipe and input matches the recipe title
    if (selectedRecipe && searchQuery === selectedRecipe.title) {
      return;
    }

    if (searchQuery.length < 1) {
      loadInitialRecipes();
      return;
    }

    const searchRecipes = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/recipes/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          // Handle new API response format
          setRecipes(data.recipes || data);
          setShowDropdown(true);
        }
      } catch (error) {
        console.error('Error searching recipes:', error);
      } finally {
        setIsSearching(false);
      }
    };

    // Use longer debounce for short queries to reduce API calls
    const debounceTime = searchQuery.length === 1 ? 500 : 300;
    const timeoutId = setTimeout(searchRecipes, debounceTime);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedRecipe]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // Only clear selection if user is typing something different from selected recipe
    if (selectedRecipe && newValue !== selectedRecipe.title) {
      setSelectedRecipe(null);
      onChange('');
    } else if (!newValue) {
      setSelectedRecipe(null);
      onChange('');
    }
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSearchQuery(recipe.title);
    onChange(recipe._id);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedRecipe(null);
    onChange('');
    setShowDropdown(false);
    loadInitialRecipes();
    inputRef.current?.focus();
  };

  const renderPinchedFingers = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const isSelected = i < rating;
      return (
        <span 
          key={i} 
          className={`inline-block transition-all text-xs ${
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

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (recipes.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <IoClose size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : recipes.length > 0 ? (
            <>
              {/* Option to clear selection */}
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setShowDropdown(false);
                  setSearchQuery('');
                  setSelectedRecipe(null);
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-200 dark:border-gray-600"
              >
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <IoClose size={16} className="text-gray-500" />
                </div>
                <div>
                  <div className="font-medium text-gray-600 dark:text-gray-400">No recipe</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Clear selection</div>
                </div>
              </button>
              
              {recipes.map((recipe) => (
                <button
                  key={recipe._id}
                  type="button"
                  onClick={() => handleRecipeSelect(recipe)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                    {recipe.image ? (
                      <img 
                        src={recipe.image} 
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <IoBook size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {recipe.title}
                          {recipe.isOwn && (
                            <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">
                              Your recipe
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            {recipe.createdBy.image ? (
                              <img 
                                src={recipe.createdBy.image} 
                                alt={recipe.createdBy.name}
                                className="w-3 h-3 rounded-full object-cover"
                              />
                            ) : (
                              <IoPersonCircle size={12} />
                            )}
                            <span>{recipe.createdBy.name}</span>
                          </div>
                          {recipe.cookingTime && (
                            <div className="flex items-center gap-1">
                              <IoTime size={12} />
                              <span>{recipe.cookingTime}m</span>
                            </div>
                          )}
                          {recipe.servings && (
                            <div className="flex items-center gap-1">
                              <IoPeople size={12} />
                              <span>{recipe.servings}</span>
                            </div>
                          )}
                          {recipe.totalRatings > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="flex">
                                {renderPinchedFingers(Math.round(recipe.averageRating || 0))}
                              </div>
                              <span>({recipe.totalRatings})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {recipe.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                        {recipe.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </>
          ) : searchQuery.length >= 1 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              No recipes found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}