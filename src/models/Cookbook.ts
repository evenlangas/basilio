import mongoose from 'mongoose';

const CookbookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: true,
  },
  recipes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
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
  image: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export default mongoose.models.Cookbook || mongoose.model('Cookbook', CookbookSchema);