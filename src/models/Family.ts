import mongoose from 'mongoose';

const FamilySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  inviteCode: {
    type: String,
    unique: true,
    required: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Family || mongoose.model('Family', FamilySchema);