import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // Optional for OAuth users
  },
  image: {
    type: String,
    required: false,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  pendingFollowers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  hasBasilioPlus: {
    type: Boolean,
    default: false,
  },
  stripeCustomerId: {
    type: String,
    default: '',
  },
  trophies: [{
    type: {
      type: String,
      required: true,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  stats: {
    recipesCreated: {
      type: Number,
      default: 0,
    },
    creationsPosted: {
      type: Number,
      default: 0,
    },
    cookingHours: {
      type: Number,
      default: 0,
    },
    onionsCut: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);