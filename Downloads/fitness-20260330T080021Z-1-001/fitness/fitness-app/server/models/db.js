const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../db.json');

const DEFAULT_DB = {
  users: [],
  workouts: [],
  goals: []
};

function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDB(DEFAULT_DB);
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('DB read error:', err);
    return DEFAULT_DB;
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('DB write error:', err);
    return false;
  }
}

// Users
function getUsers() { return readDB().users; }
function getUserById(id) { return readDB().users.find(u => u.id === id); }
function getUserByEmail(email) { return readDB().users.find(u => u.email === email); }
function saveUser(user) {
  const db = readDB();
  db.users.push(user);
  writeDB(db);
  return user;
}

// Workouts
function getWorkouts(userId) { return readDB().workouts.filter(w => w.userId === userId); }
function getWorkoutById(id, userId) { return readDB().workouts.find(w => w.id === id && w.userId === userId); }
function saveWorkout(workout) {
  const db = readDB();
  db.workouts.push(workout);
  writeDB(db);
  return workout;
}
function updateWorkout(id, userId, updates) {
  const db = readDB();
  const idx = db.workouts.findIndex(w => w.id === id && w.userId === userId);
  if (idx === -1) return null;
  db.workouts[idx] = { ...db.workouts[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.workouts[idx];
}
function deleteWorkout(id, userId) {
  const db = readDB();
  const idx = db.workouts.findIndex(w => w.id === id && w.userId === userId);
  if (idx === -1) return false;
  db.workouts.splice(idx, 1);
  writeDB(db);
  return true;
}

// Goals
function getGoals(userId) { return readDB().goals.filter(g => g.userId === userId); }
function saveGoal(goal) {
  const db = readDB();
  db.goals.push(goal);
  writeDB(db);
  return goal;
}
function updateGoal(id, userId, updates) {
  const db = readDB();
  const idx = db.goals.findIndex(g => g.id === id && g.userId === userId);
  if (idx === -1) return null;
  db.goals[idx] = { ...db.goals[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDB(db);
  return db.goals[idx];
}

module.exports = {
  getUserById, getUserByEmail, saveUser,
  getWorkouts, getWorkoutById, saveWorkout, updateWorkout, deleteWorkout,
  getGoals, saveGoal, updateGoal
};
