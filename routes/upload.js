const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const MediaFile = require('../models/MediaFile');
const { auth, projectAccess } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images, videos, and documents
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov',
    'application/pdf', 'text/plain', 'application/json'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: fileFilter
});

// Determine media type from MIME type
function getMediaType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf' || mimeType === 'text/plain') return 'document';
  return 'other';
}

// Get file metadata (for videos and images)
async function getFileMetadata(filePath, mimeType) {
  const metadata = {};
  
  if (mimeType.startsWith('image/')) {
    // For images, you might want to use a library like 'sharp' for getting dimensions
    // For now, we'll leave it empty and you can extend this
    metadata.dimensions = { width: null, height: null };
  } else if (mimeType.startsWith('video/')) {
    // For videos, you might want to use 'ffprobe' or similar
    // For now, we'll leave it empty and you can extend this
    metadata.duration = null;
    metadata.dimensions = { width: null, height: null };
    metadata.fps = null;
    metadata.codec = null;
  }
  
  return metadata;
}

// Upload single file
router.post('/file', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { projectId, taskId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Verify project access
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const mediaType = getMediaType(req.file.mimetype);
    const metadata = await getFileMetadata(req.file.path, req.file.mimetype);

    const mediaFile = new MediaFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user._id,
      project: projectId,
      task: taskId || null,
      mediaType: mediaType,
      metadata: metadata
    });

    await mediaFile.save();

    const populatedFile = await MediaFile.findById(mediaFile._id)
      .populate('uploadedBy', 'username avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(projectId).emit('file-uploaded', {
      file: populatedFile,
      projectId: projectId,
      taskId: taskId
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file: populatedFile
    });
  } catch (error) {
    console.error('File upload error:', error);
    
    // Clean up uploaded file if database save failed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }
    
    res.status(500).json({ error: 'Error uploading file' });
  }
});

// Upload multiple files
router.post('/files', auth, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { projectId, taskId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Verify project access
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const uploadedFiles = [];

    for (const file of req.files) {
      const mediaType = getMediaType(file.mimetype);
      const metadata = await getFileMetadata(file.path, file.mimetype);

      const mediaFile = new MediaFile({
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedBy: req.user._id,
        project: projectId,
        task: taskId || null,
        mediaType: mediaType,
        metadata: metadata
      });

      await mediaFile.save();
      uploadedFiles.push(mediaFile._id);
    }

    const populatedFiles = await MediaFile.find({ _id: { $in: uploadedFiles } })
      .populate('uploadedBy', 'username avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(projectId).emit('files-uploaded', {
      files: populatedFiles,
      projectId: projectId,
      taskId: taskId
    });

    res.status(201).json({
      message: 'Files uploaded successfully',
      files: populatedFiles
    });
  } catch (error) {
    console.error('Multiple file upload error:', error);
    
    // Clean up uploaded files if database save failed
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting uploaded file:', unlinkError);
        }
      }
    }
    
    res.status(500).json({ error: 'Error uploading files' });
  }
});

// Get files for a project
router.get('/project/:projectId', auth, projectAccess, async (req, res) => {
  try {
    const { mediaType, taskId, page = 1, limit = 20 } = req.query;
    const projectId = req.params.projectId;

    const filter = { project: projectId };
    if (mediaType) filter.mediaType = mediaType;
    if (taskId) filter.task = taskId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const files = await MediaFile.find(filter)
      .populate('uploadedBy', 'username avatar')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalFiles = await MediaFile.countDocuments(filter);
    const totalPages = Math.ceil(totalFiles / parseInt(limit));

    res.json({
      files,
      pagination: {
        page: parseInt(page),
        pages: totalPages,
        total: totalFiles,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Error fetching files' });
  }
});

// Get single file
router.get('/file/:fileId', auth, async (req, res) => {
  try {
    const file = await MediaFile.findById(req.params.fileId)
      .populate('uploadedBy', 'username avatar')
      .populate('project', 'name')
      .populate('task', 'title')
      .populate('annotations.author', 'username avatar');

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check project access
    const Project = require('../models/Project');
    const project = await Project.findById(file.project._id);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    // Increment download count
    file.downloadCount += 1;
    await file.save();

    res.json({ file });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Error fetching file' });
  }
});

// Add annotation to image
router.post('/file/:fileId/annotations', auth, async (req, res) => {
  try {
    const { type, coordinates, style, text } = req.body;
    const fileId = req.params.fileId;

    const file = await MediaFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.mediaType !== 'image') {
      return res.status(400).json({ error: 'Annotations are only supported for images' });
    }

    // Check project access
    const Project = require('../models/Project');
    const project = await Project.findById(file.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this file' });
    }

    const annotation = {
      type,
      coordinates,
      style: style || {},
      text: text || '',
      author: req.user._id
    };

    file.annotations.push(annotation);
    await file.save();

    const updatedFile = await MediaFile.findById(fileId)
      .populate('annotations.author', 'username avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(file.project.toString()).emit('annotation-added', {
      fileId: fileId,
      annotation: annotation,
      projectId: file.project.toString()
    });

    res.status(201).json({
      message: 'Annotation added successfully',
      annotation: updatedFile.annotations[updatedFile.annotations.length - 1]
    });
  } catch (error) {
    console.error('Error adding annotation:', error);
    res.status(500).json({ error: 'Error adding annotation' });
  }
});

// Delete file
router.delete('/file/:fileId', auth, async (req, res) => {
  try {
    const file = await MediaFile.findById(req.params.fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Check if user can delete (owner, admin, or file uploader)
    const Project = require('../models/Project');
    const project = await Project.findById(file.project);
    const canDelete = project.owner.toString() === req.user._id.toString() ||
                     req.user.role === 'admin' ||
                     file.uploadedBy.toString() === req.user._id.toString();

    if (!canDelete) {
      return res.status(403).json({ error: 'Permission denied to delete this file' });
    }

    // Delete physical file
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.error('Error deleting physical file:', unlinkError);
      // Continue with database deletion even if physical file deletion fails
    }

    // Delete from database
    await MediaFile.findByIdAndDelete(req.params.fileId);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(file.project.toString()).emit('file-deleted', {
      fileId: req.params.fileId,
      projectId: file.project.toString()
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Error deleting file' });
  }
});

module.exports = router;