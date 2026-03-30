const express = require('express');
const router = express.Router();
const { getAllGoals, addGoal, editGoal } = require('../controllers/goalController');
const { authenticateToken } = require('../middleware/auth');

// All goal routes require authentication
router.use(authenticateToken);

// GET /api/goals
router.get('/', getAllGoals);

// POST /api/goals
router.post('/', addGoal);

// PUT /api/goals/:id
router.put('/:id', editGoal);

module.exports = router;
