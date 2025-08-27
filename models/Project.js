const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'review', 'completed', 'on-hold'],
    default: 'planning'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'reviewer', 'developer', 'designer'],
      default: 'reviewer'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    allowAnonymousViewing: {
      type: Boolean,
      default: false
    },
    autoAssignReviews: {
      type: Boolean,
      default: true
    },
    notificationSettings: {
      newIssues: { type: Boolean, default: true },
      statusChanges: { type: Boolean, default: true },
      comments: { type: Boolean, default: true }
    }
  },
  gameInfo: {
    genre: String,
    platform: [String],
    targetAudience: String,
    estimatedReleaseDate: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ 'team.user': 1 });

module.exports = mongoose.model('Project', projectSchema);