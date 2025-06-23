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
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema);