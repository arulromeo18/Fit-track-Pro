const { v4: uuidv4 } = require('uuid');
const {
  getWorkouts, getWorkoutById,
  saveWorkout, updateWorkout, deleteWorkout,
  getUserById
} = require('../models/db');
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../../db.json');

function updateUserStreak(userId) {
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    const userIdx = db.users.findIndex(u => u.id === userId);
    if (userIdx === -1) return;

    const user = db.users[userIdx];
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const lastDate = user.lastWorkoutDate ? new Date(user.lastWorkoutDate).toDateString() : null;

    if (lastDate === today) return;
    if (lastDate === yesterday) {
      db.users[userIdx].streak = (user.streak || 0) + 1;
    } else {
      db.users[userIdx].streak = 1;
    }
    db.users[userIdx].lastWorkoutDate = new Date().toISOString();
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Streak update error:', err);
  }
}

function getAllWorkouts(req, res) {
  try {
    const workouts = getWorkouts(req.user.id);
    workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Weekly & monthly stats
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    const monthAgo = new Date(now - 30 * 86400000);

    const weekly = workouts.filter(w => new Date(w.date) >= weekAgo);
    const monthly = workouts.filter(w => new Date(w.date) >= monthAgo);

    const stats = {
      total: workouts.length,
      weeklyCount: weekly.length,
      monthlyCount: monthly.length,
      weeklyCalories: weekly.reduce((s, w) => s + (w.calories || 0), 0),
      monthlyCalories: monthly.reduce((s, w) => s + (w.calories || 0), 0),
      weeklyMinutes: weekly.reduce((s, w) => s + (w.duration || 0), 0),
      streak: (() => {
        try {
          const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
          const user = db.users.find(u => u.id === req.user.id);
          return user ? user.streak || 0 : 0;
        } catch { return 0; }
      })()
    };

    res.json({ workouts, stats });
  } catch (err) {
    console.error('Get workouts error:', err);
    res.status(500).json({ error: 'Failed to fetch workouts.' });
  }
}

function addWorkout(req, res) {
  try {
    const { type, duration, calories, date, notes, intensity } = req.body;

    if (!type || !duration || !date) {
      return res.status(400).json({ error: 'Type, duration, and date are required.' });
    }

    const workout = {
      id: uuidv4(),
      userId: req.user.id,
      type,
      duration: parseInt(duration),
      calories: parseInt(calories) || 0,
      date,
      notes: notes || '',
      intensity: intensity || 'medium',
      createdAt: new Date().toISOString()
    };

    saveWorkout(workout);
    updateUserStreak(req.user.id);

    res.status(201).json({ message: 'Workout logged!', workout });
  } catch (err) {
    console.error('Add workout error:', err);
    res.status(500).json({ error: 'Failed to log workout.' });
  }
}

function editWorkout(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.userId;

    const updated = updateWorkout(id, req.user.id, updates);
    if (!updated) return res.status(404).json({ error: 'Workout not found.' });

    res.json({ message: 'Workout updated!', workout: updated });
  } catch (err) {
    console.error('Edit workout error:', err);
    res.status(500).json({ error: 'Failed to update workout.' });
  }
}

function removeWorkout(req, res) {
  try {
    const { id } = req.params;
    const deleted = deleteWorkout(id, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Workout not found.' });

    res.json({ message: 'Workout deleted.' });
  } catch (err) {
    console.error('Delete workout error:', err);
    res.status(500).json({ error: 'Failed to delete workout.' });
  }
}

module.exports = { getAllWorkouts, addWorkout, editWorkout, removeWorkout };
