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
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null,
  },
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

export default mongoose.models.ShoppingList || mongoose.model('ShoppingList', ShoppingListSchema);