const { getWorkouts } = require('../models/db');
const fs = require('fs');
const path = require('path');
const DB_PATH = path.join(__dirname, '../../db.json');

const WORKOUT_TYPES = {
  cardio: ['running', 'cycling', 'swimming', 'cardio', 'hiit', 'jump rope', 'rowing'],
  strength: ['weights', 'strength', 'lifting', 'resistance', 'crossfit', 'bodyweight'],
  flexibility: ['yoga', 'pilates', 'stretching', 'flexibility'],
  sports: ['basketball', 'football', 'tennis', 'soccer', 'volleyball', 'badminton']
};

function classifyWorkout(type) {
  const t = type.toLowerCase();
  for (const [category, keywords] of Object.entries(WORKOUT_TYPES)) {
    if (keywords.some(k => t.includes(k))) return category;
  }
  return 'other';
}

function getSuggestions(req, res) {
  try {
    const workouts = getWorkouts(req.user.id);
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000);
    const twoWeeksAgo = new Date(now - 14 * 86400000);
    const monthAgo = new Date(now - 30 * 86400000);

    const weekly = workouts.filter(w => new Date(w.date) >= weekAgo);
    const prevWeek = workouts.filter(w => new Date(w.date) >= twoWeeksAgo && new Date(w.date) < weekAgo);
    const monthly = workouts.filter(w => new Date(w.date) >= monthAgo);

    // Get user streak
    let streak = 0;
    try {
      const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      const user = db.users.find(u => u.id === req.user.id);
      streak = user ? user.streak || 0 : 0;
    } catch {}

    const suggestions = [];
    const motivational = [];

    // Classify workout types this week
    const typeCounts = { cardio: 0, strength: 0, flexibility: 0, sports: 0, other: 0 };
    weekly.forEach(w => { typeCounts[classifyWorkout(w.type)]++; });

    const totalWeekly = weekly.length;
    const totalMonthly = monthly.length;
    const avgDuration = weekly.length > 0
      ? Math.round(weekly.reduce((s, w) => s + w.duration, 0) / weekly.length)
      : 0;
    const avgCalories = weekly.length > 0
      ? Math.round(weekly.reduce((s, w) => s + (w.calories || 0), 0) / weekly.length)
      : 0;

    // --- Frequency suggestions ---
    if (totalWeekly === 0) {
      suggestions.push({
        icon: '🚀',
        category: 'Getting Started',
        title: 'Start your fitness journey',
        detail: 'Log your first workout this week. Even a 20-minute walk counts!'
      });
    } else if (totalWeekly < 3) {
      suggestions.push({
        icon: '📈',
        category: 'Frequency',
        title: 'Increase your workout frequency',
        detail: `You worked out ${totalWeekly}x this week. Aim for at least 3–4 sessions for optimal results.`
      });
    } else if (totalWeekly >= 5) {
      suggestions.push({
        icon: '💪',
        category: 'Recovery',
        title: 'Don\'t forget rest days',
        detail: 'You\'re very active! Schedule 1–2 rest days per week to allow muscle recovery.'
      });
    }

    // --- Type balance suggestions ---
    if (totalWeekly >= 2) {
      if (typeCounts.cardio === 0) {
        suggestions.push({
          icon: '🏃',
          category: 'Cardio',
          title: 'Add cardio to your routine',
          detail: 'No cardio logged this week. Try a 30-min run, cycling session, or HIIT workout.'
        });
      }
      if (typeCounts.strength === 0) {
        suggestions.push({
          icon: '🏋️',
          category: 'Strength',
          title: 'Add strength training',
          detail: 'Strength training boosts metabolism and builds lean muscle. Try 2x per week.'
        });
      }
      if (typeCounts.flexibility === 0 && totalWeekly >= 4) {
        suggestions.push({
          icon: '🧘',
          category: 'Flexibility',
          title: 'Incorporate flexibility work',
          detail: 'Add yoga or stretching to improve mobility and reduce injury risk.'
        });
      }
    }

    // --- Intensity suggestions ---
    if (avgDuration > 0 && avgDuration < 30) {
      suggestions.push({
        icon: '⏱️',
        category: 'Duration',
        title: 'Try to extend your sessions',
        detail: `Your average session is ${avgDuration} min. Try pushing to 45 min for better results.`
      });
    } else if (avgDuration >= 60) {
      suggestions.push({
        icon: '⚡',
        category: 'Intensity',
        title: 'Try high-intensity shorter sessions',
        detail: 'Long sessions are great! Try adding a 20-min HIIT session for variety and efficiency.'
      });
    }

    // --- Consistency suggestions ---
    if (totalWeekly > prevWeek.length && prevWeek.length > 0) {
      suggestions.push({
        icon: '🔥',
        category: 'Consistency',
        title: 'Great improvement this week!',
        detail: `You did ${totalWeekly} workouts vs ${prevWeek.length} last week. Keep this momentum!`
      });
    } else if (totalWeekly < prevWeek.length && prevWeek.length >= 3) {
      suggestions.push({
        icon: '⚠️',
        category: 'Consistency',
        title: 'Activity dip detected',
        detail: `You did fewer workouts than last week. Try scheduling workouts in advance to stay consistent.`
      });
    }

    // --- Calorie suggestions ---
    if (avgCalories > 0 && avgCalories < 200) {
      suggestions.push({
        icon: '🔥',
        category: 'Calories',
        title: 'Increase workout intensity',
        detail: `Burning ~${avgCalories} kcal/session. Try higher intensity workouts to burn 300–500 kcal.`
      });
    }

    // --- Motivational messages ---
    if (streak >= 7) {
      motivational.push(`🏆 Incredible! ${streak}-day streak! You're unstoppable!`);
    } else if (streak >= 3) {
      motivational.push(`🔥 ${streak}-day streak! You're building a powerful habit!`);
    } else if (streak === 1) {
      motivational.push(`✅ Great start! Work out again tomorrow to build your streak!`);
    } else {
      motivational.push(`💪 Every champion started somewhere. Log a workout today!`);
    }

    if (totalMonthly >= 12) motivational.push(`🌟 ${totalMonthly} workouts this month — you're crushing it!`);
    if (totalWeekly >= 5) motivational.push(`⚡ 5+ workouts this week — elite consistency!`);

    // Default suggestion if none generated
    if (suggestions.length === 0) {
      suggestions.push({
        icon: '✨',
        category: 'Balance',
        title: 'You\'re consistent, try increasing intensity',
        detail: 'Your routine looks solid! Challenge yourself with heavier weights or faster pace.'
      });
    }

    res.json({
      suggestions,
      motivational,
      analysis: {
        weeklyWorkouts: totalWeekly,
        monthlyWorkouts: totalMonthly,
        avgDuration,
        avgCalories,
        streak,
        typeBalance: typeCounts
      }
    });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions.' });
  }
}

module.exports = { getSuggestions };
