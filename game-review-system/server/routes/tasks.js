const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// In-memory storage for tasks (this would be replaced with a database in production)
let tasks = [];

// Get all tasks
router.get('/', (req, res) => {
  res.json(tasks);
});

// Create a new task
router.post('/', (req, res) => {
  const task = {
    id: uuidv4(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  tasks.push(task);
  res.status(201).json(task);
});

// Update a task
router.patch('/:id', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  res.json(tasks[taskIndex]);
});

// Delete a task
router.delete('/:id', (req, res) => {
  const taskIndex = tasks.findIndex(t => t.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

module.exports = router;