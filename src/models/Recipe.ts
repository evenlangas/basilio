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
    enum: ['breakfast', 'lunch', 'dinner', 'dessert', 'snack', 'appetizer'],
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
}, {
  timestamps: true,
});

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);