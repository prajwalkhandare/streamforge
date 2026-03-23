const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const videoRoutes = require('./video.routes');
const userRoutes = require('./user.routes');
const searchRoutes = require('./search.routes');
const adminRoutes = require('./admin.routes');
const healthRoutes = require('./health.routes');

router.use('/auth', authRoutes);
router.use('/videos', videoRoutes);
router.use('/users', userRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);

router.get('/', (req, res) => {
  res.json({
    name: 'StreamForge API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      videos: '/api/videos',
      users: '/api/users',
      search: '/api/search',
      admin: '/api/admin',
      health: '/api/health'
    }
  });
});

module.exports = router;
