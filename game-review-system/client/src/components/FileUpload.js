import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, CircularProgress } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const FileUpload = ({ onFilesUploaded, multiple = true }) => {
  const [uploading, setUploading] = React.useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      
      if (multiple) {
        acceptedFiles.forEach(file => {
          formData.append('files', file);
        });
        
        const response = await axios.post('/api/upload/multiple', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        onFilesUploaded(response.data.files);
        toast.success('Files uploaded successfully!');
      } else {
        formData.append('file', acceptedFiles[0]);
        
        const response = await axios.post('/api/upload/single', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        onFilesUploaded([response.data.file]);
        toast.success('File uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  }, [onFilesUploaded, multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.webm']
    },
    multiple
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'grey.500',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
        '&:hover': {
          borderColor: 'primary.main',
          backgroundColor: 'action.hover',
        },
      }}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <CircularProgress />
      ) : (
        <>
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports images (PNG, JPG, GIF) and videos (MP4, MOV, AVI, WEBM)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max file size: 100MB
          </Typography>
        </>
      )}
    </Box>
  );
};

export default FileUpload;