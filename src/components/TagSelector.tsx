'use client';

import { useState } from 'react';
import { getTagSymbol } from '@/utils/tags';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

const AVAILABLE_TAGS = [
  // Meal Types (Most Common)
  'breakfast',
  'lunch',
  'dinner',
  'dessert',
  'snack',
  'appetizer',
  'side-dish',
  
  // Basic Dietary (Very Common)
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'healthy',
  
  // Cooking Style (Common)
  'quick',
  'easy',
  'baked',
  'grilled',
  'fried',
  'one-pot',
  
  // Flavor Profiles (Common)
  'spicy',
  'sweet',
  'savory',
  'comfort-food',
  
  // Dish Types (Common)
  'soup',
  'salad',
  'pasta',
  'main-course',
  
  // Health & Lifestyle (Common)
  'low-carb',
  'high-protein',
  'heart-healthy',
  'kid-friendly',
  'meal-prep',
  
  // Protein Sources (Common)
  'chicken',
  'beef',
  'seafood',
  'fish',
  'eggs',
  'vegetable',
  
  // Religious/Cultural Dietary
  'halal',
  'kosher',
  
  // Specific Diets
  'keto',
  'paleo',
  'nut-free',
  'low-sodium',
  'diabetic-friendly',
  
  // Advanced Cooking Methods
  'steamed',
  'slow-cooked',
  'fermented',
  'raw',
  
  // Specialized Health
  'anti-inflammatory',
  'immune-boosting',
  'energy-boosting',
  'detox',
  'high-fiber',
  
  // Ingredients/Categories
  'organic',
  'seasonal',
  'holiday',
  'bread',
  'rice',
  'cheese',
  'chocolate',
  'fruit',
  'grain',
  'legume',
  'nut',
  'seed',
  'herb',
  'spice',
  
  // Specialty
  'pork',
  'lamb',
  'turkey',
  'shellfish',
  'drink'
];

export default function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllTags, setShowAllTags] = useState(false);

  const filteredTags = AVAILABLE_TAGS.filter(tag =>
    tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedTags = showAllTags ? filteredTags : filteredTags.slice(0, 12);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(selectedTags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-4">
      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Tags ({selectedTags.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
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
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Available Tags */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {displayedTags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
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
        {filteredTags.length > 12 && (
          <button
            type="button"
            onClick={() => setShowAllTags(!showAllTags)}
            className="text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
          >
            {showAllTags ? 'Show Less' : `Show ${filteredTags.length - 12} More Tags`}
          </button>
        )}
      </div>

      {searchTerm && filteredTags.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No tags found matching "{searchTerm}"
        </p>
      )}
    </div>
  );
}