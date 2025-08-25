import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Chip,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import FileUpload from '../components/FileUpload';
import ImageAnnotator from '../components/ImageAnnotator';

const CreateTask = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    assignee: '',
    reporter: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFilesUploaded = (files) => {
    setAttachments([...attachments, ...files]);
  };

  const handleAnnotatedSave = (annotatedFile) => {
    setAttachments([...attachments, annotatedFile]);
    setSelectedImage(null);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.reporter) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const taskData = {
        id: uuidv4(),
        ...formData,
        status: 'pending',
        attachments: attachments.map(att => ({
          filename: att.filename,
          url: att.url,
          type: att.mimetype
        }))
      };

      await axios.post('/api/sheets/tasks', taskData);
      toast.success('Task created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Issue
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Brief description of the issue"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed description of the issue, steps to reproduce, expected behavior, etc."
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="e.g., UI/UX, Gameplay, Performance"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Reporter"
                name="reporter"
                value={formData.reporter}
                onChange={handleInputChange}
                placeholder="Your name or email"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleInputChange}
                placeholder="Person responsible for this issue"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Attachments
              </Typography>
              <FileUpload onFilesUploaded={handleFilesUploaded} />
              
              {attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Uploaded Files:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {attachments.map((file, index) => (
                      <Chip
                        key={index}
                        label={file.originalName || file.filename}
                        onDelete={() => removeAttachment(index)}
                        onClick={() => {
                          if (file.mimetype?.startsWith('image/')) {
                            setSelectedImage(file);
                          }
                        }}
                        color={file.filename?.includes('annotated') ? 'secondary' : 'default'}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Grid>

            {selectedImage && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Annotate Image
                </Typography>
                <ImageAnnotator
                  imageUrl={selectedImage.url}
                  originalFilename={selectedImage.filename}
                  onSave={handleAnnotatedSave}
                />
              </Grid>
            )}

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Create Issue'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateTask;