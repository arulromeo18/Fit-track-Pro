const express = require('express');
const router = express.Router();
const { getAllWorkouts, addWorkout, editWorkout, removeWorkout } = require('../controllers/workoutController');
const { authenticateToken } = require('../middleware/auth');

// All workout routes require authentication
router.use(authenticateToken);

// GET /api/workouts
router.get('/', getAllWorkouts);

// POST /api/workouts
router.post('/', addWorkout);

// PUT /api/workouts/:id
router.put('/:id', editWorkout);

// DELETE /api/workouts/:id
router.delete('/:id', removeWorkout);

module.exports = router;
