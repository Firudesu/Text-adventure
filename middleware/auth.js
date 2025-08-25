const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token or user not active.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

const adminAuth = async (req, res, next) => {
  try {
    await auth(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed.' });
  }
};

const projectAccess = async (req, res, next) => {
  try {
    const Project = require('../models/Project');
    const projectId = req.params.projectId || req.body.project;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID required.' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check if user has access to this project
    const hasAccess = project.owner.toString() === req.user._id.toString() ||
                     project.team.some(member => member.user.toString() === req.user._id.toString()) ||
                     req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied to this project.' });
    }

    req.project = project;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error during project access check.' });
  }
};

module.exports = { auth, adminAuth, projectAccess };