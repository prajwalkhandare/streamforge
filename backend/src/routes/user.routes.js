const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { upload } = require('../middleware/upload');

// All user routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile',
  userController.getProfile
);

router.put('/profile',
  [
    body('fullName').optional().isString(),
    body('bio').optional().isString(),
    body('language').optional().isString(),
    body('notifications').optional().isBoolean()
  ],
  validateRequest,
  userController.updateProfile
);

router.post('/profile/avatar',
  upload.single('avatar'),
  userController.updateAvatar
);

// Watch history
router.get('/history',
  userController.getWatchHistory
);

router.delete('/history/:id',
  [param('id').isUUID()],
  validateRequest,
  userController.removeFromHistory
);

router.delete('/history',
  userController.clearHistory
);

// Watch later / My List
router.get('/my-list',
  userController.getMyList
);

router.post('/my-list/:videoId',
  [param('videoId').isUUID()],
  validateRequest,
  userController.addToMyList
);

router.delete('/my-list/:videoId',
  [param('videoId').isUUID()],
  validateRequest,
  userController.removeFromMyList
);

// Preferences
router.get('/preferences',
  userController.getPreferences
);

router.put('/preferences',
  [
    body('contentLanguage').optional().isString(),
    body('autoplay').optional().isBoolean(),
    body('subtitles').optional().isBoolean(),
    body('quality').optional().isIn(['auto', '1080p', '720p', '480p'])
  ],
  validateRequest,
  userController.updatePreferences
);

// Ratings
router.get('/ratings',
  userController.getUserRatings
);

// Admin routes
router.get('/',
  authorize('admin'),
  userController.getAllUsers
);

router.get('/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validateRequest,
  userController.getUserById
);

router.put('/:id/role',
  authorize('admin'),
  [
    param('id').isUUID(),
    body('role').isIn(['user', 'admin', 'moderator'])
  ],
  validateRequest,
  userController.updateUserRole
);

router.delete('/:id',
  authorize('admin'),
  [param('id').isUUID()],
  validateRequest,
  userController.deleteUser
);

module.exports = router;