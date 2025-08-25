const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaFile'
  }],
  isResolution: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'needs-review', 'resolved', 'closed', 'rejected'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'design', 'performance', 'accessibility', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MediaFile'
  }],
  comments: [commentSchema],
  timeline: [{
    action: {
      type: String,
      enum: ['created', 'assigned', 'status_changed', 'priority_changed', 'commented', 'resolved', 'reopened']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    oldValue: String,
    newValue: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  dueDate: {
    type: Date,
    default: null
  },
  estimatedHours: {
    type: Number,
    min: 0,
    default: null
  },
  actualHours: {
    type: Number,
    min: 0,
    default: null
  },
  gameArea: {
    level: String,
    scene: String,
    coordinates: {
      x: Number,
      y: Number,
      z: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
taskSchema.index({ project: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ reporter: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ createdAt: -1 });
taskSchema.index({ tags: 1 });

// Add timeline entry before saving
taskSchema.pre('save', function(next) {
  if (this.isNew) {
    this.timeline.push({
      action: 'created',
      user: this.reporter,
      timestamp: new Date()
    });
  } else {
    // Track changes
    const modifiedPaths = this.modifiedPaths();
    if (modifiedPaths.includes('status')) {
      this.timeline.push({
        action: 'status_changed',
        user: this.assignee || this.reporter,
        oldValue: this.constructor.findOne({ _id: this._id }).status,
        newValue: this.status,
        timestamp: new Date()
      });
    }
    if (modifiedPaths.includes('assignee')) {
      this.timeline.push({
        action: 'assigned',
        user: this.assignee,
        timestamp: new Date()
      });
    }
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);