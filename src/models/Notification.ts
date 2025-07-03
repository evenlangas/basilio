import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['cookbook_invite', 'shopping_list_invite', 'follow_request', 'yum', 'comment'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    cookbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cookbook',
    },
    shoppingListId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShoppingList',
    },
    creationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creation',
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  read: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
});

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);