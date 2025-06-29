import mongoose from 'mongoose';

const ShoppingListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'My Shopping List',
  },
  items: [{
    name: String,
    amount: String,
    unit: String,
    completed: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  recipeLog: {
    type: [{
      recipe: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: true,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      servings: {
        type: Number,
        default: 1,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
      addedCount: {
        type: Number,
        default: 0,
      },
      combinedCount: {
        type: Number,
        default: 0,
      },
    }],
    default: []
  },
}, {
  timestamps: true,
});

export default mongoose.models.ShoppingList || mongoose.model('ShoppingList', ShoppingListSchema);