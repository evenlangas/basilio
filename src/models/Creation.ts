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
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  recipeRating: {
    type: Number,
    min: 0,
    max: 5,
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Creation || mongoose.model('Creation', CreationSchema);