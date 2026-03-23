const express = require('express');
const router = express.Router();
const { query } = require('express-validator');
const searchController = require('../controllers/search.controller');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// Public search (with optional auth for personalized results)
router.get('/',
  optionalAuthenticate,
  [
    query('q').notEmpty().isString(),
    query('type').optional().isIn(['all', 'movies', 'shows', 'people']),
    query('category').optional().isString(),
    query('genre').optional().isString(),
    query('year').optional().isInt({ min: 1900, max: 2100 }),
    query('rating').optional().isFloat({ min: 0, max: 10 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('sort').optional().isIn(['relevance', 'rating', 'year', 'views'])
  ],
  validateRequest,
  searchController.search
);

// Autocomplete suggestions
router.get('/suggestions',
  [
    query('q').notEmpty().isString(),
    query('limit').optional().isInt({ min: 1, max: 10 })
  ],
  validateRequest,
  searchController.getSuggestions
);

// Popular searches (trending)
router.get('/trending',
  searchController.getTrendingSearches
);

// Search history (requires auth)
router.get('/history',
  authenticate,
  searchController.getSearchHistory
);

router.delete('/history',
  authenticate,
  searchController.clearSearchHistory
);

// Advanced search filters
router.get('/filters',
  searchController.getSearchFilters
);

// Category-based search
router.get('/category/:category',
  [
    param('category').isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  validateRequest,
  searchController.searchByCategory
);

// Voice search support (text endpoint)
router.post('/voice',
  [
    body('query').notEmpty().isString(),
    body('language').optional().isString()
  ],
  validateRequest,
  searchController.voiceSearch
);

// Search recommendations
router.get('/recommendations',
  authenticate,
  searchController.getRecommendations
);

module.exports = router;
