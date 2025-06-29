import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import ShoppingList from '@/models/ShoppingList';
import Recipe from '@/models/Recipe';

// Helper function to normalize ingredient names for comparison
function normalizeIngredientName(name: string): string {
  return name.toLowerCase()
    .replace(/\b(fresh|dried|ground|chopped|diced|sliced|whole|organic)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to check if two ingredients are similar
function areSimilarIngredients(name1: string, name2: string): boolean {
  const normalized1 = normalizeIngredientName(name1);
  const normalized2 = normalizeIngredientName(name2);
  
  // Direct match
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Check if one contains the other (for cases like "tomato" and "cherry tomatoes")
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  // Check for common ingredient variations
  const variations: { [key: string]: string[] } = {
    'onion': ['onions', 'yellow onion', 'white onion', 'red onion'],
    'tomato': ['tomatoes', 'cherry tomatoes', 'roma tomatoes'],
    'garlic': ['garlic cloves', 'garlic clove', 'minced garlic'],
    'butter': ['unsalted butter', 'salted butter'],
    'oil': ['olive oil', 'vegetable oil', 'cooking oil'],
    'salt': ['sea salt', 'kosher salt', 'table salt'],
    'pepper': ['black pepper', 'white pepper', 'ground pepper'],
  };
  
  for (const [base, variants] of Object.entries(variations)) {
    if ((normalized1.includes(base) || variants.some(v => normalized1.includes(v))) &&
        (normalized2.includes(base) || variants.some(v => normalized2.includes(v)))) {
      return true;
    }
  }
  
  return false;
}

// Helper function to normalize units for comparison
function normalizeUnit(unit: string): string {
  const unitMap: { [key: string]: string } = {
    // Weight
    'g': 'g', 'gram': 'g', 'grams': 'g', 'gr': 'g',
    'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg', 'kilo': 'kg',
    'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
    'lb': 'lb', 'pound': 'lb', 'pounds': 'lb', 'lbs': 'lb',
    
    // Volume
    'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml', 'millilitres': 'ml',
    'l': 'l', 'liter': 'l', 'liters': 'l', 'litre': 'l', 'litres': 'l',
    'cup': 'cup', 'cups': 'cup', 'c': 'cup',
    'tbsp': 'tbsp', 'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbs': 'tbsp',
    'tsp': 'tsp', 'teaspoon': 'tsp', 'teaspoons': 'tsp', 'ts': 'tsp',
    'fl oz': 'fl oz', 'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz', 'floz': 'fl oz',
    
    // Count
    'piece': 'piece', 'pieces': 'piece', 'pc': 'piece', 'pcs': 'piece',
    'item': 'item', 'items': 'item',
    '': 'piece', // Default empty unit to piece
  };
  
  const normalized = unit.toLowerCase().trim();
  return unitMap[normalized] || normalized;
}

// Helper function to convert between compatible units
function convertToBaseUnit(amount: number, unit: string): { amount: number; unit: string } | null {
  const normalizedUnit = normalizeUnit(unit);
  
  // Weight conversions (to grams)
  const weightConversions: { [key: string]: number } = {
    'g': 1,
    'kg': 1000,
    'oz': 28.35,
    'lb': 453.59,
  };
  
  // Volume conversions (to ml)
  const volumeConversions: { [key: string]: number } = {
    'ml': 1,
    'l': 1000,
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'fl oz': 29.57,
  };
  
  if (weightConversions[normalizedUnit]) {
    return { amount: amount * weightConversions[normalizedUnit], unit: 'g' };
  }
  
  if (volumeConversions[normalizedUnit]) {
    return { amount: amount * volumeConversions[normalizedUnit], unit: 'ml' };
  }
  
  // For count-based units, no conversion needed
  if (['piece', 'item'].includes(normalizedUnit)) {
    return { amount, unit: 'piece' };
  }
  
  return null;
}

// Helper function to convert from base unit back to display unit
function convertFromBaseUnit(amount: number, baseUnit: string, preferredUnit: string): { amount: number; unit: string } {
  const normalizedPreferred = normalizeUnit(preferredUnit);
  
  if (baseUnit === 'g') {
    const weightConversions: { [key: string]: number } = {
      'g': 1,
      'kg': 1000,
      'oz': 28.35,
      'lb': 453.59,
    };
    
    if (weightConversions[normalizedPreferred]) {
      return { amount: amount / weightConversions[normalizedPreferred], unit: preferredUnit };
    }
  }
  
  if (baseUnit === 'ml') {
    const volumeConversions: { [key: string]: number } = {
      'ml': 1,
      'l': 1000,
      'cup': 240,
      'tbsp': 15,
      'tsp': 5,
      'fl oz': 29.57,
    };
    
    if (volumeConversions[normalizedPreferred]) {
      return { amount: amount / volumeConversions[normalizedPreferred], unit: preferredUnit };
    }
  }
  
  return { amount, unit: baseUnit };
}

// Helper function to combine quantities with proper addition
function combineQuantities(amount1: string, unit1: string, amount2: string, unit2: string): { amount: string; unit: string } {
  const num1 = parseFloat(amount1) || 0;
  const num2 = parseFloat(amount2) || 0;
  
  // If either amount is 0 or can't be parsed, return the other
  if (num1 === 0) return { amount: amount2, unit: unit2 };
  if (num2 === 0) return { amount: amount1, unit: unit1 };
  
  // Try to convert both to a common base unit
  const converted1 = convertToBaseUnit(num1, unit1);
  const converted2 = convertToBaseUnit(num2, unit2);
  
  if (converted1 && converted2 && converted1.unit === converted2.unit) {
    // Both can be converted to the same base unit
    const totalAmount = converted1.amount + converted2.amount;
    
    // Convert back to the preferred unit (prefer the first unit, or use a smart choice)
    let preferredUnit = unit1;
    
    // Smart unit selection: prefer larger units for large quantities
    if (converted1.unit === 'g' && totalAmount >= 1000) {
      preferredUnit = 'kg';
    } else if (converted1.unit === 'ml' && totalAmount >= 1000) {
      preferredUnit = 'l';
    }
    
    const final = convertFromBaseUnit(totalAmount, converted1.unit, preferredUnit);
    
    // Format the amount nicely
    let formattedAmount: string;
    if (final.amount % 1 === 0) {
      formattedAmount = final.amount.toString();
    } else if (final.amount < 1) {
      formattedAmount = final.amount.toFixed(2).replace(/\.?0+$/, '');
    } else {
      formattedAmount = final.amount.toFixed(1).replace(/\.0$/, '');
    }
    
    return { amount: formattedAmount, unit: final.unit };
  }
  
  // If units are exactly the same (normalized), add directly
  if (normalizeUnit(unit1) === normalizeUnit(unit2)) {
    const total = num1 + num2;
    const formattedAmount = total % 1 === 0 ? total.toString() : total.toFixed(1);
    return { amount: formattedAmount, unit: unit1 };
  }
  
  // If units can't be converted, combine as text to ensure we don't lose information
  const existing = `${amount1} ${unit1}`.trim();
  const new_ = `${amount2} ${unit2}`.trim();
  
  return { amount: `${existing} + ${new_}`, unit: '' };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipeId, servings } = await request.json();

    if (!recipeId) {
      return NextResponse.json({ error: 'Recipe ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Fetch the recipe (user's personal recipes only)
    const recipe = await Recipe.findOne({ 
      _id: recipeId, 
      createdBy: session.user.id 
    });
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Get or create shopping list (user's personal shopping lists only)
    // Find lists where user is owner OR is invited
    let shoppingList = await ShoppingList.findOne({
      $or: [
        { createdBy: session.user.id },
        { invitedUsers: session.user.id }
      ]
    });
    
    if (!shoppingList) {
      shoppingList = await ShoppingList.create({
        name: 'My Shopping List',
        items: [],
        createdBy: session.user.id,
        invitedUsers: [],
      });
    }

    // Calculate ingredient amounts based on servings
    const servingMultiplier = servings && servings > 0 ? servings / (recipe.servings || 1) : 1;
    
    // Process each recipe ingredient
    const newItems = [];
    // Convert Mongoose documents to plain objects to avoid issues with spread operator
    const updatedItems = shoppingList.items.map(item => 
      item.toObject ? item.toObject() : item
    );

    for (const ingredient of recipe.ingredients) {
      if (!ingredient.name.trim()) continue;

      // Calculate adjusted amount
      let adjustedAmount = ingredient.amount;
      if (servingMultiplier !== 1 && ingredient.amount) {
        const num = parseFloat(ingredient.amount);
        if (!isNaN(num)) {
          adjustedAmount = (num * servingMultiplier).toString();
        }
      }


      // Check if similar ingredient already exists
      let foundSimilar = false;
      
      for (let i = 0; i < updatedItems.length; i++) {
        const isSimilar = areSimilarIngredients(updatedItems[i].name, ingredient.name);
        if (isSimilar) {
          // Combine with existing item
          const combined = combineQuantities(
            updatedItems[i].amount,
            updatedItems[i].unit,
            adjustedAmount,
            ingredient.unit
          );
          
          // Preserve all original fields and only update amount, unit, and completion
          updatedItems[i] = {
            ...updatedItems[i],
            amount: combined.amount,
            unit: combined.unit,
            completed: false, // Reset completion status
          };
          
          foundSimilar = true;
          break;
        }
      }

      if (!foundSimilar) {
        // Add as new item
        newItems.push({
          name: ingredient.name,
          amount: adjustedAmount,
          unit: ingredient.unit,
          completed: false,
          addedBy: session.user.id,
        });
      }
    }

    // Add all new items to the list
    updatedItems.push(...newItems);

    // Update the shopping list
    const result = await ShoppingList.findByIdAndUpdate(
      shoppingList._id, 
      { items: updatedItems },
      { new: true }
    );

    const totalIngredients = recipe.ingredients.filter(ing => ing.name.trim()).length;
    const combinedCount = totalIngredients - newItems.length;
    
    return NextResponse.json({ 
      message: `Processed ${totalIngredients} ingredients from "${recipe.title}"`,
      addedCount: newItems.length,
      combinedCount: combinedCount,
      recipeName: recipe.title
    });
  } catch (error) {
    console.error('Add recipe to shopping list error:', error);
    return NextResponse.json(
      { error: 'Failed to add recipe to shopping list' },
      { status: 500 }
    );
  }
}