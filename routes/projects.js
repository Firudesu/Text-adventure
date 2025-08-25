const express = require('express');
const Project = require('../models/Project');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all projects for the current user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    // Build filter query
    const filter = {
      $or: [
        { owner: req.user._id },
        { 'team.user': req.user._id }
      ]
    };
    
    if (status) filter.status = status;
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const projects = await Project.find(filter)
      .populate('owner', 'username email avatar')
      .populate('team.user', 'username email avatar')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalProjects = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalProjects / parseInt(limit));

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        pages: totalPages,
        total: totalProjects,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// Get project by ID
router.get('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('owner', 'username email avatar')
      .populate('team.user', 'username email avatar role');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user has access to this project
    const hasAccess = project.owner._id.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user._id.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// Create new project
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      gameInfo,
      settings
    } = req.body;

    const project = new Project({
      name,
      description,
      owner: req.user._id,
      team: [{
        user: req.user._id,
        role: 'owner',
        joinedAt: new Date()
      }],
      gameInfo: gameInfo || {},
      settings: settings || {}
    });

    await project.save();
    
    const populatedProject = await Project.findById(project._id)
      .populate('owner', 'username email avatar')
      .populate('team.user', 'username email avatar');

    res.status(201).json({
      message: 'Project created successfully',
      project: populatedProject
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error creating project' });
  }
});

// Update project
router.put('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only project owners and admins can update projects' });
    }

    const updates = req.body;
    const allowedUpdates = ['name', 'description', 'status', 'gameInfo', 'settings'];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        if (field === 'gameInfo' || field === 'settings') {
          project[field] = { ...project[field], ...updates[field] };
        } else {
          project[field] = updates[field];
        }
      }
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('owner', 'username email avatar')
      .populate('team.user', 'username email avatar');

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error updating project' });
  }
});

// Add team member
router.post('/:projectId/team', auth, async (req, res) => {
  try {
    const { userId, role = 'reviewer' } = req.body;
    
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only project owners and admins can add team members' });
    }

    // Check if user is already in team
    const existingMember = project.team.find(member => member.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Add team member
    project.team.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });

    await project.save();

    const updatedProject = await Project.findById(project._id)
      .populate('team.user', 'username email avatar');

    res.json({
      message: 'Team member added successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({ error: 'Error adding team member' });
  }
});

// Remove team member
router.delete('/:projectId/team/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only project owners and admins can remove team members' });
    }

    // Don't allow removing the owner
    if (req.params.userId === project.owner.toString()) {
      return res.status(400).json({ error: 'Cannot remove project owner' });
    }

    // Remove team member
    project.team = project.team.filter(member => member.user.toString() !== req.params.userId);
    await project.save();

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({ error: 'Error removing team member' });
  }
});

// Delete project
router.delete('/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is owner or admin
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Only project owners and admins can delete projects' });
    }

    await Project.findByIdAndDelete(req.params.projectId);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// Get project statistics
router.get('/:projectId/stats', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check access
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    // Get task statistics (this would be moved to a proper aggregation)
    const Task = require('../models/Task');
    const MediaFile = require('../models/MediaFile');

    const taskStats = await Task.aggregate([
      { $match: { project: project._id } },
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

    const mediaStats = await MediaFile.aggregate([
      { $match: { project: project._id } },
      {
        $group: {
          _id: '$mediaType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    res.json({
      project: {
        name: project.name,
        status: project.status,
        teamSize: project.team.length,
        createdAt: project.createdAt
      },
      tasks: taskStats[0] || {},
      media: mediaStats.reduce((acc, item) => {
        acc[item._id] = {
          count: item.count,
          totalSize: item.totalSize
        };
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Error fetching project statistics' });
  }
});

module.exports = router;