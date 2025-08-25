const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

module.exports = (upload) => {
  // Upload single file
  router.post('/single', upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      }
    });
  });

  // Upload multiple files
  router.post('/multiple', upload.array('files', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      url: `/uploads/${file.filename}`
    }));

    res.json({
      message: 'Files uploaded successfully',
      files
    });
  });

  // Save annotated image
  router.post('/save-annotation', async (req, res) => {
    try {
      const { imageData, originalFilename } = req.body;
      
      // Remove data URL prefix
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Generate filename for annotated image
      const timestamp = Date.now();
      const annotatedFilename = `annotated-${timestamp}-${originalFilename}`;
      const filePath = path.join(__dirname, '../../uploads', annotatedFilename);
      
      // Save the annotated image
      await sharp(buffer)
        .png()
        .toFile(filePath);
      
      res.json({
        message: 'Annotated image saved successfully',
        file: {
          filename: annotatedFilename,
          url: `/uploads/${annotatedFilename}`
        }
      });
    } catch (error) {
      console.error('Error saving annotated image:', error);
      res.status(500).json({ error: 'Failed to save annotated image' });
    }
  });

  // Delete file
  router.delete('/:filename', async (req, res) => {
    try {
      const filePath = path.join(__dirname, '../../uploads', req.params.filename);
      await fs.unlink(filePath);
      res.json({ message: 'File deleted successfully' });
    } catch (error) {
      res.status(404).json({ error: 'File not found' });
    }
  });

  return router;
};