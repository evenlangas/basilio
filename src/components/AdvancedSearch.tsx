'use client';

import { useState } from 'react';
import { IoChevronDown, IoClose, IoSearch, IoOptions } from 'react-icons/io5';
import { TAG_PRIORITY_ORDER, getTagSymbol } from '@/utils/tags';
import CountrySelector from '@/components/CountrySelector';

export interface SearchFilters {
  contentType: 'all' | 'recipe' | 'creation' | 'chef' | 'cookbook';
  tags?: string[];
  cookingTime?: {
    min?: number;
    max?: number;
  };
  cuisine?: string;
  ingredients?: string[];
  sortBy: 'relevance' | 'date' | 'alphabetical' | 'popularity' | 'rating';
  sortOrder: 'asc' | 'desc';
}

interface AdvancedSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  loading?: boolean;
  initialQuery?: string;
}

// Use the same tag options as the recipe creation/edit forms
const TAG_OPTIONS = TAG_PRIORITY_ORDER;

export default function AdvancedSearch({ onSearch, loading, initialQuery = '' }: AdvancedSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);
  const [ingredientInput, setIngredientInput] = useState('');
  const [showIngredientsSearch, setShowIngredientsSearch] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    contentType: 'all',
    sortBy: 'relevance',
    sortOrder: 'desc'
  });

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const hasFilters = () => {
    return filters.contentType !== 'all' ||
           (filters.tags && filters.tags.length > 0) ||
           filters.cookingTime?.min ||
           filters.cookingTime?.max ||
           filters.cuisine ||
           (filters.ingredients && filters.ingredients.length > 0) ||
           filters.sortBy !== 'relevance';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleTag = (tag: string) => {
    setFilters(prev => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter(t => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setFilters(prev => ({
        ...prev,
        ingredients: [...(prev.ingredients || []), ingredientInput.trim()]
      }));
      setIngredientInput('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    setFilters(prev => ({
      ...prev,
      ingredients: (prev.ingredients || []).filter(i => i !== ingredient)
    }));
  };

  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addIngredient();
    }
  };

  const clearFilters = () => {
    setFilters({
      contentType: 'all',
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    setIngredientInput('');
    setShowIngredientsSearch(false);
  };

  const getSortOptions = () => {
    const baseOptions = [
      { value: 'relevance', label: 'Relevance' },
      { value: 'date', label: 'Date Created' },
      { value: 'alphabetical', label: 'Alphabetical' }
    ];

    if (filters.contentType === 'recipe' || filters.contentType === 'creation') {
      baseOptions.push({ value: 'popularity', label: 'Popularity' });
    }

    if (filters.contentType === 'recipe') {
      baseOptions.push({ value: 'rating', label: 'Rating' });
    }

    return baseOptions;
  };

  // Filter and display tags similar to TagSelector
  const filteredTags = TAG_OPTIONS.filter(tag =>
    tag.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const displayedTags = showAllTags ? filteredTags : filteredTags.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearch size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for chefs, recipes, creations, or cookbooks..."
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

      {/* Advanced Search Toggle */}
      <div className="flex justify-center sm:justify-start">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <IoOptions size={16} />
          <span>Advanced Search</span>
          <IoChevronDown 
            size={14} 
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Advanced Search
            </h3>
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Clear all
            </button>
          </div>

          {/* Content Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content Type
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'recipe', label: 'Recipes' },
                { value: 'creation', label: 'Creations' },
                { value: 'chef', label: 'Chefs' },
                { value: 'cookbook', label: 'Cookbooks' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('contentType', option.value)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filters.contentType === option.value
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe/Creation Specific Filters */}
          {(filters.contentType === 'recipe' || filters.contentType === 'creation') && (
            <>
              {/* Tags Filter */}
              <div className="space-y-4">
                {/* Selected Tags */}
                {filters.tags && filters.tags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Selected Tags ({filters.tags.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {filters.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                        >
                          <span>{getTagSymbol(tag)}</span>
                          <span className="capitalize">{tag.replace('-', ' ')}</span>
                          <span className="text-green-600 dark:text-green-400">×</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tag Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Add Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Search tags (e.g., vegetarian, quick, healthy)..."
                    value={tagSearchTerm}
                    onChange={(e) => setTagSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Available Tags */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {displayedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                          filters.tags?.includes(tag)
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span>{getTagSymbol(tag)}</span>
                        <span className="capitalize">{tag.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>

                  {/* Show More/Less Button */}
                  {filteredTags.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllTags(!showAllTags)}
                      className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                    >
                      {showAllTags ? 'Show Less' : `Show ${filteredTags.length - 3} More Tags`}
                    </button>
                  )}
                </div>

                {tagSearchTerm && filteredTags.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No tags found matching "{tagSearchTerm}"
                  </p>
                )}
              </div>

              {/* Cooking Time Filter (Recipe/Creation) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cooking Time (minutes)
                </label>
                <div className="flex items-center gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.cookingTime?.min || ''}
                      onChange={(e) => updateFilter('cookingTime', { 
                        ...filters.cookingTime, 
                        min: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">to</span>
                  <div>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.cookingTime?.max || ''}
                      onChange={(e) => updateFilter('cookingTime', { 
                        ...filters.cookingTime, 
                        max: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                      className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cuisine Filter (Recipe only) */}
              {filters.contentType === 'recipe' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cuisine
                  </label>
                  <CountrySelector
                    value={filters.cuisine || ''}
                    onChange={(countryCode) => updateFilter('cuisine', countryCode || undefined)}
                    placeholder="Select cuisine..."
                    className="w-full"
                  />
                </div>
              )}

              {/* Ingredients Filter (Recipe only) */}
              {filters.contentType === 'recipe' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Search by Ingredients
                      {filters.ingredients && filters.ingredients.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                          {filters.ingredients.length}
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowIngredientsSearch(!showIngredientsSearch)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    >
                      {showIngredientsSearch ? (
                        <>
                          <span>Hide</span>
                          <IoChevronDown className="w-3 h-3 rotate-180 transition-transform" />
                        </>
                      ) : (
                        <>
                          <span>Show</span>
                          <IoChevronDown className="w-3 h-3 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {showIngredientsSearch && (
                    <div className="space-y-3">
                      {/* Selected Ingredients */}
                      {filters.ingredients && filters.ingredients.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selected Ingredients ({filters.ingredients.length})
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {filters.ingredients.map((ingredient) => (
                              <button
                                key={ingredient}
                                type="button"
                                onClick={() => removeIngredient(ingredient)}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                              >
                                <span>{ingredient}</span>
                                <span className="text-blue-600 dark:text-blue-400">×</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Add Ingredient */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Add Ingredient
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={ingredientInput}
                            onChange={(e) => setIngredientInput(e.target.value)}
                            onKeyPress={handleIngredientKeyPress}
                            placeholder="e.g., tomato, chicken, garlic..."
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          />
                          <button
                            type="button"
                            onClick={addIngredient}
                            disabled={!ingredientInput.trim()}
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Sort Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort by
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {getSortOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Order
              </label>
              <select
                value={filters.sortOrder}
                onChange={(e) => updateFilter('sortOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="desc">
                  {filters.sortBy === 'alphabetical' ? 'Z to A' : 'Highest to Lowest'}
                </option>
                <option value="asc">
                  {filters.sortBy === 'alphabetical' ? 'A to Z' : 'Lowest to Highest'}
                </option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSearch}
              disabled={loading || (!query.trim() && !hasFilters())}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto"></div>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Simple Search Button (when advanced search is closed) */}
      {!showAdvanced && (
        <div className="flex justify-center">
          <button
            onClick={handleSearch}
            disabled={loading || (!query.trim() && !hasFilters())}
            className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
            ) : (
              'Search'
            )}
          </button>
        </div>
      )}
    </div>
  );
}