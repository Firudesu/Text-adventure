const express = require('express');
const router = express.Router();
const googleSheets = require('../services/googleSheets');

// Initialize spreadsheet (creates headers if needed)
router.post('/initialize', async (req, res) => {
  try {
    await googleSheets.initializeSpreadsheet();
    res.json({ message: 'Spreadsheet initialized successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tasks
router.get('/tasks', async (req, res) => {
  try {
    const tasks = await googleSheets.getTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task
router.post('/tasks', async (req, res) => {
  try {
    const result = await googleSheets.createTask(req.body);
    res.json({ message: 'Task created successfully', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a task
router.patch('/tasks/:id', async (req, res) => {
  try {
    const result = await googleSheets.updateTask(req.params.id, req.body);
    res.json({ message: 'Task updated successfully', data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;