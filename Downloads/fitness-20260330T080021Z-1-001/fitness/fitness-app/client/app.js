// ===== STATE =====
const API = '';
let token = localStorage.getItem('fittrack_token');
let currentUser = JSON.parse(localStorage.getItem('fittrack_user') || 'null');
let allWorkouts = [];
let activityChart = null;
let editingWorkoutId = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  if (!token) { window.location.href = 'index.html'; return; }
  initUser();
  loadDashboard();
});

function initUser() {
  if (!currentUser) return;
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-plan').textContent = currentUser.plan === 'pro' ? '⭐ Pro Plan' : 'Free Plan';
  document.getElementById('user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();
  // Set today's date as default for workout form
  document.getElementById('w-date').value = new Date().toISOString().split('T')[0];
}

// ===== AUTH =====
function logout() {
  localStorage.removeItem('fittrack_token');
  localStorage.removeItem('fittrack_user');
  window.location.href = 'index.html';
}

// ===== API HELPER =====
async function api(endpoint, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + endpoint, opts);
  const data = await res.json();
  if (res.status === 401 || res.status === 403) { logout(); return; }
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ===== NAVIGATION =====
function showSection(name, el) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  if (el) el.classList.add('active');

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');

  // Load section data
  if (name === 'dashboard') loadDashboard();
  else if (name === 'workouts') loadWorkouts();
  else if (name === 'goals') loadGoals();
  else if (name === 'suggestions') loadSuggestions();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const data = await api('/api/workouts');
    if (!data) return;
    allWorkouts = data.workouts;
    const s = data.stats;

    document.getElementById('stat-streak').textContent = s.streak;
    document.getElementById('stat-weekly').textContent = s.weeklyCount;
    document.getElementById('stat-calories').textContent = s.weeklyCalories;
    document.getElementById('stat-minutes').textContent = s.weeklyMinutes;

    renderRecentWorkouts(allWorkouts.slice(0, 5));
    renderActivityChart(allWorkouts);

    // Motivational message
    const msgs = [
      '💪 Keep pushing — every rep counts!',
      '🔥 You\'re building something great!',
      '🏆 Consistency is your superpower!',
      '⚡ Champions train even when they don\'t feel like it!',
      '🎯 One workout at a time. You\'ve got this!'
    ];
    if (s.streak >= 7) {
      document.getElementById('motivational-msg').textContent = `🏆 ${s.streak}-day streak! You're on fire!`;
    } else if (s.streak >= 3) {
      document.getElementById('motivational-msg').textContent = `🔥 ${s.streak}-day streak! Keep it going!`;
    } else {
      document.getElementById('motivational-msg').textContent = msgs[Math.floor(Math.random() * msgs.length)];
    }
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function renderRecentWorkouts(workouts) {
  const el = document.getElementById('recent-workouts-list');
  if (!workouts.length) {
    el.innerHTML = '<div class="empty-state">No workouts yet. Log your first one!</div>';
    return;
  }
  el.innerHTML = workouts.map(w => workoutItemHTML(w, false)).join('');
}

function renderActivityChart(workouts) {
  const labels = [];
  const counts = [];
  const calories = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { weekday: 'short' });
    labels.push(label);
    const dayWorkouts = workouts.filter(w => w.date === dateStr);
    counts.push(dayWorkouts.length);
    calories.push(dayWorkouts.reduce((s, w) => s + (w.calories || 0), 0));
  }

  const ctx = document.getElementById('activityChart').getContext('2d');
  if (activityChart) activityChart.destroy();

  activityChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Workouts',
          data: counts,
          backgroundColor: 'rgba(249,115,22,0.7)',
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Calories',
          data: calories,
          type: 'line',
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderWidth: 2,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 4,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#8b91a8', font: { size: 12 } } } },
      scales: {
        x: { ticks: { color: '#8b91a8' }, grid: { color: '#252a38' } },
        y: {
          type: 'linear', position: 'left',
          ticks: { color: '#8b91a8', stepSize: 1 },
          grid: { color: '#252a38' },
          title: { display: true, text: 'Workouts', color: '#8b91a8' }
        },
        y1: {
          type: 'linear', position: 'right',
          ticks: { color: '#3b82f6' }, grid: { drawOnChartArea: false },
          title: { display: true, text: 'Calories', color: '#3b82f6' }
        }
      }
    }
  });
}

// ===== WORKOUTS =====
async function loadWorkouts() {
  try {
    const data = await api('/api/workouts');
    if (!data) return;
    allWorkouts = data.workouts;
    renderWorkoutsList(allWorkouts);
  } catch (err) { console.error('Load workouts error:', err); }
}

function renderWorkoutsList(workouts) {
  const el = document.getElementById('workouts-list');
  if (!workouts.length) {
    el.innerHTML = '<div class="empty-state">No workouts logged yet. Click "+ Log Workout" to start!</div>';
    return;
  }
  el.innerHTML = workouts.map(w => workoutItemHTML(w, true)).join('');
}

function workoutItemHTML(w, showActions) {
  const icons = {
    running: '🏃', cycling: '🚴', swimming: '🏊', yoga: '🧘',
    weights: '🏋️', hiit: '⚡', walking: '🚶', boxing: '🥊',
    basketball: '🏀', football: '⚽', tennis: '🎾', default: '💪'
  };
  const type = w.type.toLowerCase();
  const icon = Object.keys(icons).find(k => type.includes(k)) ? icons[Object.keys(icons).find(k => type.includes(k))] : icons.default;
  const date = new Date(w.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const intensityClass = `intensity-${w.intensity || 'medium'}`;
  const actions = showActions ? `
    <div class="workout-actions">
      <button class="btn-icon" onclick="openEditWorkout('${w.id}')" title="Edit">✏️</button>
      <button class="btn-icon del" onclick="deleteWorkout('${w.id}')" title="Delete">🗑️</button>
    </div>` : '';

  return `
    <div class="workout-item" id="workout-${w.id}">
      <div class="workout-type-icon">${icon}</div>
      <div class="workout-info">
        <div class="workout-name">${escHtml(w.type)} <span class="intensity-badge ${intensityClass}">${w.intensity || 'medium'}</span></div>
        <div class="workout-meta">${w.duration} min${w.notes ? ' · ' + escHtml(w.notes.substring(0, 40)) : ''}</div>
      </div>
      <div class="workout-stats">
        <div class="workout-calories">${w.calories || 0} kcal</div>
        <div class="workout-date">${date}</div>
      </div>
      ${actions}
    </div>`;
}

function openWorkoutModal() {
  editingWorkoutId = null;
  document.getElementById('workout-modal-title').textContent = 'Log Workout';
  document.getElementById('workout-submit-btn').textContent = 'Save Workout';
  document.getElementById('w-type').value = '';
  document.getElementById('w-duration').value = '';
  document.getElementById('w-calories').value = '';
  document.getElementById('w-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('w-intensity').value = 'medium';
  document.getElementById('w-notes').value = '';
  document.getElementById('w-edit-id').value = '';
  document.getElementById('workout-error').classList.add('hidden');
  document.getElementById('workout-modal').classList.remove('hidden');
}

function openEditWorkout(id) {
  const w = allWorkouts.find(x => x.id === id);
  if (!w) return;
  editingWorkoutId = id;
  document.getElementById('workout-modal-title').textContent = 'Edit Workout';
  document.getElementById('workout-submit-btn').textContent = 'Update Workout';
  document.getElementById('w-type').value = w.type;
  document.getElementById('w-duration').value = w.duration;
  document.getElementById('w-calories').value = w.calories || '';
  document.getElementById('w-date').value = w.date;
  document.getElementById('w-intensity').value = w.intensity || 'medium';
  document.getElementById('w-notes').value = w.notes || '';
  document.getElementById('w-edit-id').value = id;
  document.getElementById('workout-error').classList.add('hidden');
  document.getElementById('workout-modal').classList.remove('hidden');
}

function closeWorkoutModal() {
  document.getElementById('workout-modal').classList.add('hidden');
  editingWorkoutId = null;
}

async function submitWorkout(e) {
  e.preventDefault();
  const errEl = document.getElementById('workout-error');
  const btn = document.getElementById('workout-submit-btn');
  errEl.classList.add('hidden');
  btn.disabled = true;

  const payload = {
    type: document.getElementById('w-type').value,
    duration: document.getElementById('w-duration').value,
    calories: document.getElementById('w-calories').value || 0,
    date: document.getElementById('w-date').value,
    intensity: document.getElementById('w-intensity').value,
    notes: document.getElementById('w-notes').value
  };

  try {
    if (editingWorkoutId) {
      await api(`/api/workouts/${editingWorkoutId}`, 'PUT', payload);
    } else {
      await api('/api/workouts', 'POST', payload);
    }
    closeWorkoutModal();
    loadWorkouts();
    loadDashboard();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
  }
}

async function deleteWorkout(id) {
  if (!confirm('Delete this workout?')) return;
  try {
    await api(`/api/workouts/${id}`, 'DELETE');
    loadWorkouts();
    loadDashboard();
  } catch (err) { alert(err.message); }
}

// ===== GOALS =====
async function loadGoals() {
  try {
    const data = await api('/api/goals');
    if (!data) return;
    renderGoals(data.goals);
  } catch (err) { console.error('Load goals error:', err); }
}

function renderGoals(goals) {
  const el = document.getElementById('goals-list');
  if (!goals.length) {
    el.innerHTML = '<div class="empty-state" style="grid-column:1/-1">No goals set yet. Click "+ Add Goal" to get started!</div>';
    return;
  }
  el.innerHTML = goals.map(g => {
    const p = g.progress || { percent: 0, current: 0, target: g.target };
    const done = p.percent >= 100;
    return `
      <div class="goal-card ${done ? 'goal-completed' : ''}">
        <div class="goal-header">
          <div>
            <div class="goal-label">${escHtml(g.label)}</div>
            <div class="goal-type">${goalTypeLabel(g.type)}</div>
          </div>
          <div class="goal-percent">${p.percent}%</div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${p.percent}%"></div>
        </div>
        <div class="goal-progress-text">
          ${done ? '✅ Goal achieved!' : `${p.current} / ${p.target} ${goalUnit(g.type)}`}
        </div>
      </div>`;
  }).join('');
}

function goalTypeLabel(type) {
  const map = {
    workouts_per_week: 'Workouts per Week',
    calories_per_week: 'Calories per Week',
    minutes_per_week: 'Minutes per Week',
    monthly_workouts: 'Monthly Workouts',
    weight_loss: 'Weight Loss'
  };
  return map[type] || type;
}

function goalUnit(type) {
  const map = {
    workouts_per_week: 'workouts', calories_per_week: 'kcal',
    minutes_per_week: 'mins', monthly_workouts: 'workouts', weight_loss: 'kg'
  };
  return map[type] || '';
}

function openGoalModal() {
  document.getElementById('goal-error').classList.add('hidden');
  document.getElementById('g-type').value = 'workouts_per_week';
  document.getElementById('g-label').value = '';
  document.getElementById('g-target').value = '';
  document.getElementById('g-start').value = '';
  updateGoalFields();
  document.getElementById('goal-modal').classList.remove('hidden');
}

function closeGoalModal() {
  document.getElementById('goal-modal').classList.add('hidden');
}

function updateGoalFields() {
  const type = document.getElementById('g-type').value;
  const startGroup = document.getElementById('g-start-group');
  const targetLabel = document.getElementById('g-target-label');
  const labels = {
    workouts_per_week: 'Target Workouts/Week',
    calories_per_week: 'Target Calories/Week',
    minutes_per_week: 'Target Minutes/Week',
    monthly_workouts: 'Target Workouts/Month',
    weight_loss: 'Target Weight (kg)'
  };
  targetLabel.textContent = labels[type] || 'Target';
  startGroup.style.display = type === 'weight_loss' ? 'block' : 'none';
}

async function submitGoal(e) {
  e.preventDefault();
  const errEl = document.getElementById('goal-error');
  errEl.classList.add('hidden');

  const payload = {
    type: document.getElementById('g-type').value,
    label: document.getElementById('g-label').value,
    target: document.getElementById('g-target').value,
    startValue: document.getElementById('g-start').value || 0
  };

  try {
    await api('/api/goals', 'POST', payload);
    closeGoalModal();
    loadGoals();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove('hidden');
  }
}

// ===== SUGGESTIONS =====
async function loadSuggestions() {
  try {
    const data = await api('/api/suggestions');
    if (!data) return;
    renderSuggestions(data.suggestions, data.motivational, data.analysis);
  } catch (err) { console.error('Load suggestions error:', err); }
}

function renderSuggestions(suggestions, motivational, analysis) {
  const el = document.getElementById('suggestions-list');

  // Motivational banner
  const motBanner = motivational && motivational.length
    ? `<div class="suggestion-card" style="border-color:var(--accent);background:rgba(249,115,22,0.05);grid-column:1/-1">
        <div class="suggestion-icon">💬</div>
        <div class="suggestion-cat">Motivation</div>
        <div class="suggestion-title">${motivational[0]}</div>
        ${motivational[1] ? `<div class="suggestion-detail" style="margin-top:0.4rem">${motivational[1]}</div>` : ''}
      </div>` : '';

  const cards = suggestions.map(s => `
    <div class="suggestion-card">
      <div class="suggestion-icon">${s.icon}</div>
      <div class="suggestion-cat">${s.category}</div>
      <div class="suggestion-title">${s.title}</div>
      <div class="suggestion-detail">${s.detail}</div>
    </div>`).join('');

  el.innerHTML = motBanner + cards;

  // Analysis section
  if (analysis) {
    document.getElementById('analysis-card').style.display = 'block';
    const typeBalance = analysis.typeBalance || {};
    document.getElementById('analysis-body').innerHTML = `
      <div class="analysis-item"><div class="analysis-val">${analysis.weeklyWorkouts}</div><div class="analysis-key">This Week</div></div>
      <div class="analysis-item"><div class="analysis-val">${analysis.monthlyWorkouts}</div><div class="analysis-key">This Month</div></div>
      <div class="analysis-item"><div class="analysis-val">${analysis.avgDuration}</div><div class="analysis-key">Avg Duration (min)</div></div>
      <div class="analysis-item"><div class="analysis-val">${analysis.avgCalories}</div><div class="analysis-key">Avg Calories</div></div>
      <div class="analysis-item"><div class="analysis-val">${analysis.streak}</div><div class="analysis-key">Day Streak 🔥</div></div>
      <div class="analysis-item"><div class="analysis-val">${typeBalance.cardio || 0}</div><div class="analysis-key">Cardio Sessions</div></div>
      <div class="analysis-item"><div class="analysis-val">${typeBalance.strength || 0}</div><div class="analysis-key">Strength Sessions</div></div>
      <div class="analysis-item"><div class="analysis-val">${typeBalance.flexibility || 0}</div><div class="analysis-key">Flexibility Sessions</div></div>
    `;
  }
}

// ===== UTILITY =====
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Close modals on overlay click
document.getElementById('workout-modal').addEventListener('click', function(e) {
  if (e.target === this) closeWorkoutModal();
});
document.getElementById('goal-modal').addEventListener('click', function(e) {
  if (e.target === this) closeGoalModal();
});
