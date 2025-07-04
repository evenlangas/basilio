import mongoose from 'mongoose';

const RecipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  ingredients: [{
    name: String,
    amount: String,
    unit: String,
  }],
  instructions: [{
    step: Number,
    description: String,
  }],
  cookingTime: {
    type: Number,
    default: 0,
  },
  servings: {
    type: Number,
    default: 1,
  },
  url: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  tags: [String],
  recommendedDrinks: {
    type: String,
    default: '',
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer', ''],
    default: '',
  },
  cuisine: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  isReference: {
    type: Boolean,
    default: false,
  },
  cookbookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cookbook',
    default: null,
  },
  originalRecipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null,
  },
  originalChef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  copiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  ratings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    creation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creation',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  averageRating: {
    type: Number,
    default: 0,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Optional database indexes for improved performance
// These indexes are recommended but not required for basic functionality
// Run scripts/create-recipe-indexes.js to create them for optimal performance

// Basic indexes that are most beneficial
RecipeSchema.index({ createdBy: 1, createdAt: -1 }); // User's recipes by date
RecipeSchema.index({ isPrivate: 1, averageRating: -1, totalRatings: -1 }); // Public recipes by popularity
RecipeSchema.index({ createdAt: -1 }); // Recent recipes

// Additional performance indexes (create via script for large datasets)
// RecipeSchema.index({ title: 'text', description: 'text', tags: 'text' });
// RecipeSchema.index({ isPrivate: 1, createdAt: -1 });
// RecipeSchema.index({ createdBy: 1, isPrivate: 1 });
// RecipeSchema.index({ totalRatings: -1, averageRating: -1 });

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);