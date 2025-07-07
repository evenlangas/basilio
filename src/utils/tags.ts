export function getTagSymbol(tag: string): string {
  const tagSymbols: { [key: string]: string } = {
    // Meal Types (Most Common)
    'breakfast': '🌅',
    'lunch': '🌞',
    'dinner': '🌙',
    'dessert': '🍰',
    'snack': '🍿',
    'appetizer': '🥗',
    'side-dish': '🥄',
    
    // Basic Dietary (Very Common)
    'vegetarian': '🥬',
    'vegan': '🌱',
    'gluten-free': '🚫🌾',
    'dairy-free': '🥛❌',
    'healthy': '💚',
    
    // Cooking Style (Common)
    'quick': '⚡',
    'easy': '👌',
    'baked': '🥖',
    'grilled': '🔥',
    'fried': '🍳',
    'one-pot': '🍲',
    
    // Flavor Profiles (Common)
    'spicy': '🌶️',
    'sweet': '🍯',
    'savory': '🧂',
    'comfort-food': '🤗',
    
    // Dish Types (Common)
    'soup': '🍜',
    'salad': '🥗',
    'pasta': '🍝',
    'main-course': '🍽️',
    
    // Health & Lifestyle (Common)
    'low-carb': '📉',
    'high-protein': '💪',
    'heart-healthy': '❤️',
    'kid-friendly': '👶',
    'meal-prep': '📦',
    
    // Protein Sources (Common)
    'chicken': '🐔',
    'beef': '🥩',
    'seafood': '🐟',
    'fish': '🐠',
    'eggs': '🥚',
    'vegetable': '🥕',
    
    // Religious/Cultural Dietary
    'halal': '☪️',
    'kosher': '✡️',
    
    // Specific Diets
    'keto': '🥑',
    'paleo': '🦴',
    'nut-free': '🥜❌',
    'low-sodium': '🧂❌',
    'diabetic-friendly': '🩺',
    
    // Advanced Cooking Methods
    'steamed': '♨️',
    'slow-cooked': '🐌',
    'fermented': '🦠',
    'raw': '🥒',
    
    // Specialized Health
    'anti-inflammatory': '🧘',
    'immune-boosting': '🛡️',
    'energy-boosting': '⚡',
    'detox': '🧹',
    'high-fiber': '🌾',
    
    // Ingredients/Categories
    'organic': '🌿',
    'seasonal': '🍂',
    'holiday': '🎄',
    'bread': '🍞',
    'rice': '🍚',
    'cheese': '🧀',
    'chocolate': '🍫',
    'fruit': '🍎',
    'grain': '🌾',
    'legume': '🫘',
    'nut': '🥜',
    'seed': '🌰',
    'herb': '🌿',
    'spice': '🌟',
    
    // Specialty
    'pork': '🐷',
    'lamb': '🐑',
    'turkey': '🦃',
    'shellfish': '🦐',
    'drink': '🥤'
  };
  
  return tagSymbols[tag.toLowerCase()] || '🏷️';
}

export function getTagsDisplay(tags: string[]): string {
  if (!tags || tags.length === 0) return '';
  
  return tags.map(tag => getTagSymbol(tag)).join(' ');
}

export function getMealTypeFromTags(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  
  const mealTypeTags = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer', 'side-dish'];
  
  for (const tag of tags) {
    if (mealTypeTags.includes(tag.toLowerCase())) {
      return tag;
    }
  }
  
  return null;
}

export function getTagsWithoutMealType(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];
  
  const mealTypeTags = ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer', 'side-dish'];
  
  return tags.filter(tag => !mealTypeTags.includes(tag.toLowerCase()));
}

// This is the same order as in TagSelector component
const TAG_PRIORITY_ORDER = [
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

export function getFirstTagByPriority(tags: string[]): string | null {
  if (!tags || tags.length === 0) return null;
  
  // Find the first tag that appears in our priority order
  for (const priorityTag of TAG_PRIORITY_ORDER) {
    if (tags.some(tag => tag.toLowerCase() === priorityTag.toLowerCase())) {
      return priorityTag;
    }
  }
  
  // If no tags match our priority list, return the first tag
  return tags[0] || null;
}