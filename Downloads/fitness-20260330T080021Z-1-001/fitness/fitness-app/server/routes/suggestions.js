const express = require('express');
const router = express.Router();
const { getSuggestions } = require('../controllers/suggestionController');
const { authenticateToken } = require('../middleware/auth');

// GET /api/suggestions
router.get('/', authenticateToken, getSuggestions);

module.exports = router;
