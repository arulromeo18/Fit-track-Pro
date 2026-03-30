# FitTrack Pro 💪
## 🌐 Live Demo
https://fit-track-pro-5wqk.onrender.com
## 📸 Screenshot

![Dashboard](dashboard.png)
## 👨‍💻 Author
Arul

- GitHub: https://github.com/arulromeo18
  
A full-stack fitness tracking application with authentication, goal tracking, analytics, and smart suggestions. Built using Node.js, Express, and Vanilla JavaScript, and deployed on the cloud.

## Features
- 🔐 JWT Authentication (Register/Login)
- 🏋️ Workout Logging (add, edit, delete)
- 📊 Progress Charts (Chart.js, weekly activity)
- 🎯 Goal Setting & Tracking (5 goal types)
- 💡 Smart Fitness Suggestions (AI-style engine)
- 🔥 Streak Tracking
- 💰 Pricing Page (Free / Pro ₹199/month)
- 📱 Fully Mobile Responsive

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: JSON file (db.json)
- **Auth**: JWT + bcryptjs
- **Frontend**: HTML, CSS, Vanilla JS
- **Charts**: Chart.js (CDN)

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

### 3. Open browser
```
http://localhost:3000
```

## Project Structure
```
Fit-track-Pro/
├── server/
│   ├── server.js
│   ├── middleware/auth.js
│   ├── models/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── workoutController.js
│   │   ├── goalController.js
│   │   └── suggestionController.js
│   └── routes/
│       ├── auth.js
│       ├── workouts.js
│       ├── goals.js
│       └── suggestions.js
├── client/
│   ├── index.html
│   ├── dashboard.html
│   ├── styles.css
│   └── app.js
├── db.json
├── package.json
└── README.md
```

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register user |
| POST | /api/auth/login | ❌ | Login user |
| GET | /api/auth/me | ✅ | Get current user |
| GET | /api/workouts | ✅ | Get all workouts + stats |
| POST | /api/workouts | ✅ | Log new workout |
| PUT | /api/workouts/:id | ✅ | Edit workout |
| DELETE | /api/workouts/:id | ✅ | Delete workout |
| GET | /api/goals | ✅ | Get goals with progress |
| POST | /api/goals | ✅ | Create goal |
| PUT | /api/goals/:id | ✅ | Update goal |
| GET | /api/suggestions | ✅ | Get smart suggestions |

## Goal Types
- `workouts_per_week` — Target workouts per week
- `calories_per_week` — Target calories burned per week
- `minutes_per_week` — Target active minutes per week
- `monthly_workouts` — Target workouts per month
- `weight_loss` — Target weight in kg

## Pricing
| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0/month | Basic tracking, goals, streak |
| Pro | ₹199/month | Smart suggestions, advanced analytics, insights |
