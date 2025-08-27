const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'arrow', 'rectangle', 'circle', 'freehand', 'highlight'],
    required: true
  },
  coordinates: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: Number,
    height: Number,
    points: [{ x: Number, y: Number }] // For freehand drawing
  },
  style: {
    color: { type: String, default: '#ff0000' },
    strokeWidth: { type: Number, default: 2 },
    fontSize: { type: Number, default: 14 },
    fillColor: String,
    opacity: { type: Number, default: 1 }
  },
  text: String, // For text annotations
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const mediaFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'document', 'other'],
    required: true
  },
  metadata: {
    duration: Number, // For videos
    dimensions: {
      width: Number,
      height: Number
    },
    fps: Number, // For videos
    codec: String
  },
  annotations: [annotationSchema],
  versions: [{
    version: { type: Number, required: true },
    path: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    changelog: String
  }],
  currentVersion: {
    type: Number,
    default: 1
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
mediaFileSchema.index({ project: 1, mediaType: 1 });
mediaFileSchema.index({ task: 1 });
mediaFileSchema.index({ uploadedBy: 1 });
mediaFileSchema.index({ createdAt: -1 });

// Virtual for file URL
mediaFileSchema.virtual('url').get(function() {
  return `/uploads/${this.filename}`;
});

// Virtual for thumbnail URL
mediaFileSchema.virtual('thumbnailUrl').get(function() {
  return this.thumbnailPath ? `/uploads/thumbnails/${this.thumbnailPath}` : null;
});

// Ensure virtuals are included in JSON
mediaFileSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MediaFile', mediaFileSchema);