import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  Divider,
  Avatar,
  IconButton,
  Dialog,
  DialogContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactPlayer from 'react-player';
import {
  ArrowBack,
  Edit,
  Save,
  Cancel,
  Image as ImageIcon,
  VideoLibrary,
  Download,
  Fullscreen
} from '@mui/icons-material';
import ImageAnnotator from '../components/ImageAnnotator';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [annotating, setAnnotating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await axios.get('/api/sheets/tasks');
      const foundTask = response.data.find(t => t.id === id);
      if (foundTask) {
        setTask(foundTask);
        setEditData({
          status: foundTask.status,
          priority: foundTask.priority,
          assignee: foundTask.assignee
        });
      } else {
        toast.error('Task not found');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await axios.patch(`/api/sheets/tasks/${id}`, editData);
      setTask({ ...task, ...editData });
      setEditing(false);
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!task) {
    return <Typography>Task not found</Typography>;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Typography variant="h4">{task.title}</Typography>
              {!editing ? (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                  variant="outlined"
                >
                  Edit
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    variant="contained"
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={() => {
                      setEditing(false);
                      setEditData({
                        status: task.status,
                        priority: task.priority,
                        assignee: task.assignee
                      });
                    }}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {task.description}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  {editing ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={editData.status}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="done">Done</MenuItem>
                    </TextField>
                  ) : (
                    <Chip
                      label={task.status.replace('_', ' ')}
                      color={getStatusColor(task.status)}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  {editing ? (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="medium">Medium</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </TextField>
                  ) : (
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority)}
                      variant="outlined"
                      sx={{ mt: 1 }}
                    />
                  )}
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Assignee
                  </Typography>
                  {editing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editData.assignee}
                      onChange={(e) => setEditData({ ...editData, assignee: e.target.value })}
                      placeholder="Assign to..."
                    />
                  ) : (
                    <Typography>{task.assignee || 'Unassigned'}</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>

            {task.attachments && task.attachments.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Attachments ({task.attachments.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {task.attachments.map((attachment, index) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Paper
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': { backgroundColor: 'action.hover' }
                          }}
                          onClick={() => setSelectedMedia(attachment)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {attachment.type?.startsWith('image/') ? <ImageIcon /> : <VideoLibrary />}
                            </Avatar>
                            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                              <Typography variant="body2" noWrap>
                                {attachment.filename}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {attachment.type}
                              </Typography>
                            </Box>
                          </Box>
                          {attachment.type?.startsWith('image/') && attachment.filename?.includes('annotated') && (
                            <Chip label="Annotated" size="small" color="secondary" sx={{ mt: 1 }} />
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Reporter
                </Typography>
                <Typography>{task.reporter}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Category
                </Typography>
                <Typography>{task.category || 'None'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography>
                  {new Date(task.created_at).toLocaleString()}
                </Typography>
              </Box>
              {task.updated_at && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography>
                    {new Date(task.updated_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Media Viewer Dialog */}
      <Dialog
        open={!!selectedMedia}
        onClose={() => {
          setSelectedMedia(null);
          setAnnotating(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          {selectedMedia && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{selectedMedia.filename}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedMedia.type?.startsWith('image/') && !selectedMedia.filename?.includes('annotated') && (
                    <Button
                      onClick={() => setAnnotating(!annotating)}
                      variant={annotating ? 'contained' : 'outlined'}
                    >
                      {annotating ? 'View' : 'Annotate'}
                    </Button>
                  )}
                  <IconButton
                    component="a"
                    href={selectedMedia.url}
                    download
                    target="_blank"
                  >
                    <Download />
                  </IconButton>
                </Box>
              </Box>
              
              {annotating ? (
                <ImageAnnotator
                  imageUrl={selectedMedia.url}
                  originalFilename={selectedMedia.filename}
                  onSave={(annotatedFile) => {
                    toast.success('Annotation saved!');
                    setAnnotating(false);
                  }}
                />
              ) : (
                <>
                  {selectedMedia.type?.startsWith('image/') ? (
                    <img
                      src={selectedMedia.url}
                      alt={selectedMedia.filename}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  ) : (
                    <ReactPlayer
                      url={selectedMedia.url}
                      controls
                      width="100%"
                      height="auto"
                    />
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default TaskDetail;