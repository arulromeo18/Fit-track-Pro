const { v4: uuidv4 } = require('uuid');
const { getGoals, saveGoal, updateGoal, getWorkouts } = require('../models/db');

function computeProgress(goal, workouts) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 86400000);
  const monthAgo = new Date(now - 30 * 86400000);

  const weekly = workouts.filter(w => new Date(w.date) >= weekAgo);
  const monthly = workouts.filter(w => new Date(w.date) >= monthAgo);

  switch (goal.type) {
    case 'workouts_per_week': {
      const current = weekly.length;
      return { current, target: goal.target, percent: Math.min(100, Math.round((current / goal.target) * 100)) };
    }
    case 'calories_per_week': {
      const current = weekly.reduce((s, w) => s + (w.calories || 0), 0);
      return { current, target: goal.target, percent: Math.min(100, Math.round((current / goal.target) * 100)) };
    }
    case 'minutes_per_week': {
      const current = weekly.reduce((s, w) => s + (w.duration || 0), 0);
      return { current, target: goal.target, percent: Math.min(100, Math.round((current / goal.target) * 100)) };
    }
    case 'monthly_workouts': {
      const current = monthly.length;
      return { current, target: goal.target, percent: Math.min(100, Math.round((current / goal.target) * 100)) };
    }
    case 'weight_loss': {
      const current = goal.currentValue || 0;
      const diff = goal.startValue - goal.target;
      const done = goal.startValue - current;
      return { current, target: goal.target, percent: diff > 0 ? Math.min(100, Math.round((done / diff) * 100)) : 0 };
    }
    default:
      return { current: 0, target: goal.target, percent: 0 };
  }
}

function getAllGoals(req, res) {
  try {
    const goals = getGoals(req.user.id);
    const workouts = getWorkouts(req.user.id);

    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      progress: computeProgress(goal, workouts)
    }));

    res.json({ goals: goalsWithProgress });
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals.' });
  }
}

function addGoal(req, res) {
  try {
    const { type, target, label, startValue } = req.body;

    if (!type || !target || !label) {
      return res.status(400).json({ error: 'Type, target, and label are required.' });
    }

    const goal = {
      id: uuidv4(),
      userId: req.user.id,
      type,
      target: parseFloat(target),
      label,
      startValue: parseFloat(startValue) || 0,
      currentValue: parseFloat(startValue) || 0,
      completed: false,
      createdAt: new Date().toISOString()
    };

    saveGoal(goal);

    const workouts = getWorkouts(req.user.id);
    const progress = computeProgress(goal, workouts);

    res.status(201).json({ message: 'Goal created!', goal: { ...goal, progress } });
  } catch (err) {
    console.error('Add goal error:', err);
    res.status(500).json({ error: 'Failed to create goal.' });
  }
}

function editGoal(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates.id;
    delete updates.userId;

    if (updates.currentValue !== undefined) {
      const goals = getGoals(req.user.id);
      const goal = goals.find(g => g.id === id);
      if (goal && goal.type === 'weight_loss') {
        updates.completed = parseFloat(updates.currentValue) <= goal.target;
      }
    }

    const updated = updateGoal(id, req.user.id, updates);
    if (!updated) return res.status(404).json({ error: 'Goal not found.' });

    const workouts = getWorkouts(req.user.id);
    const progress = computeProgress(updated, workouts);

    res.json({ message: 'Goal updated!', goal: { ...updated, progress } });
  } catch (err) {
    console.error('Edit goal error:', err);
    res.status(500).json({ error: 'Failed to update goal.' });
  }
}

module.exports = { getAllGoals, addGoal, editGoal };
