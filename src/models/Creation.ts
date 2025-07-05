import mongoose from 'mongoose';

const CreationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
  recipes: [{
    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipe',
      required: true,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null,
    },
  }],
  // Legacy field for backward compatibility
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null,
  },
  recipeRating: {
    type: Number,
    min: 0,
    max: 5,
    default: null,
  },
  eatenWith: {
    type: String,
    default: '',
  },
  cookingTime: {
    type: Number,
    default: 0,
  },
  drankWith: {
    type: String,
    default: '',
  },
  chefName: {
    type: String,
    default: '',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    mentions: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      username: String,
      startIndex: Number,
      endIndex: Number,
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

export default mongoose.models.Creation || mongoose.model('Creation', CreationSchema);