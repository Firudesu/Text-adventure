const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { auth, projectAccess } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', auth, projectAccess, async (req, res) => {
  try {
    const { status, assignee, priority, category, search, page = 1, limit = 50 } = req.query;
    const projectId = req.params.projectId;

    // Build filter query
    const filter = { project: projectId };
    
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const tasks = await Task.find(filter)
      .populate('reporter', 'username email avatar')
      .populate('assignee', 'username email avatar')
      .populate('attachments')
      .populate('comments.author', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTasks = await Task.countDocuments(filter);
    const totalPages = Math.ceil(totalTasks / parseInt(limit));

    res.json({
      tasks,
      pagination: {
        page: parseInt(page),
        pages: totalPages,
        total: totalTasks,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});

// Get task by ID
router.get('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId)
      .populate('project', 'name')
      .populate('reporter', 'username email avatar')
      .populate('assignee', 'username email avatar')
      .populate('attachments')
      .populate('comments.author', 'username avatar')
      .populate('timeline.user', 'username avatar');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to this task's project
    const project = await Project.findById(task.project._id);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Error fetching task' });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      description,
      project,
      assignee,
      priority,
      category,
      tags,
      dueDate,
      estimatedHours,
      gameArea
    } = req.body;

    // Verify project access
    const projectDoc = await Project.findById(project);
    if (!projectDoc) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const hasAccess = projectDoc.owner.toString() === req.user._id.toString() ||
                     projectDoc.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const task = new Task({
      title,
      description,
      project,
      reporter: req.user._id,
      assignee: assignee || null,
      priority: priority || 'medium',
      category: category || 'other',
      tags: tags || [],
      dueDate: dueDate || null,
      estimatedHours: estimatedHours || null,
      gameArea: gameArea || {}
    });

    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('reporter', 'username email avatar')
      .populate('assignee', 'username email avatar')
      .populate('project', 'name');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(project).emit('task-created', {
      task: populatedTask,
      projectId: project
    });

    res.status(201).json({
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Error creating task' });
  }
});

// Update task
router.put('/:taskId', auth, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check project access
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }

    // Track status changes for timeline
    const oldStatus = task.status;
    
    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'assignee', 'status', 'priority', 
      'category', 'tags', 'dueDate', 'estimatedHours', 'actualHours', 'gameArea'
    ];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        task[field] = updates[field];
      }
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('reporter', 'username email avatar')
      .populate('assignee', 'username email avatar')
      .populate('attachments')
      .populate('comments.author', 'username avatar');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-updated', {
      task: updatedTask,
      projectId: task.project.toString(),
      updatedBy: req.user.username
    });

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Error updating task' });
  }
});

// Add comment to task
router.post('/:taskId/comments', auth, async (req, res) => {
  try {
    const { content, attachments, isResolution } = req.body;
    const taskId = req.params.taskId;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check project access
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this task' });
    }

    const comment = {
      author: req.user._id,
      content,
      attachments: attachments || [],
      isResolution: isResolution || false
    };

    task.comments.push(comment);
    
    // Add timeline entry
    task.timeline.push({
      action: 'commented',
      user: req.user._id,
      timestamp: new Date()
    });

    await task.save();

    const updatedTask = await Task.findById(taskId)
      .populate('comments.author', 'username avatar')
      .populate('comments.attachments');

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('new-comment', {
      taskId: taskId,
      comment: updatedTask.comments[updatedTask.comments.length - 1],
      projectId: task.project.toString(),
      author: req.user.username
    });

    res.status(201).json({
      message: 'Comment added successfully',
      comment: updatedTask.comments[updatedTask.comments.length - 1]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Error adding comment' });
  }
});

// Delete task
router.delete('/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check project access
    const project = await Project.findById(task.project);
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Only project owners and admins can delete tasks' });
    }

    await Task.findByIdAndDelete(req.params.taskId);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-deleted', {
      taskId: req.params.taskId,
      projectId: task.project.toString()
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Error deleting task' });
  }
});

// Get task statistics for a project
router.get('/project/:projectId/stats', auth, projectAccess, async (req, res) => {
  try {
    const projectId = req.params.projectId;

    const stats = await Task.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          needsReview: { $sum: { $cond: [{ $eq: ['$status', 'needs-review'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          medium: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
          low: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
        }
      }
    ]);

    res.json({ stats: stats[0] || {} });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Error fetching task statistics' });
  }
});

module.exports = router;