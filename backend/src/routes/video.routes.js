const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const videoController = require('../controllers/video.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('category').optional().isString(),
    query('sort').optional().isIn(['popular', 'recent', 'rating'])
  ],
  validateRequest,
  videoController.getVideos
);

router.get('/featured',
  videoController.getFeaturedVideos
);

router.get('/trending',
  videoController.getTrendingVideos
);

router.get('/:id',
  [param('id').isUUID()],
  validateRequest,
  videoController.getVideoById
);

// Protected routes
router.use(authenticate);

router.post('/:id/watch',
  [param('id').isUUID()],
  validateRequest,
  videoController.watchVideo
);

router.post('/:id/like',
  [param('id').isUUID()],
  validateRequest,
  videoController.likeVideo
);

router.post('/:id/unlike',
  [param('id').isUUID()],
  validateRequest,
  videoController.unlikeVideo
);

router.get('/:id/related',
  [param('id').isUUID()],
  validateRequest,
  videoController.getRelatedVideos
);

// Admin only routes
router.use(authorize('admin'));

router.post('/',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  videoController.createVideo
);

router.put('/:id',
  [param('id').isUUID()],
  validateRequest,
  videoController.updateVideo
);

router.delete('/:id',
  [param('id').isUUID()],
  validateRequest,
  videoController.deleteVideo
);

module.exports = router;