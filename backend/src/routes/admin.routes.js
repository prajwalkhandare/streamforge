const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// Dashboard stats
router.get('/dashboard/stats',
  adminController.getDashboardStats
);

router.get('/dashboard/realtime',
  adminController.getRealtimeStats
);

// User management
router.get('/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('role').optional().isIn(['user', 'admin', 'moderator']),
    query('status').optional().isIn(['active', 'inactive', 'banned']),
    query('search').optional().isString()
  ],
  validateRequest,
  adminController.getUsers
);

router.get('/users/:id',
  [param('id').isUUID()],
  validateRequest,
  adminController.getUserDetails
);

router.put('/users/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['active', 'inactive', 'banned'])
  ],
  validateRequest,
  adminController.updateUserStatus
);

// Video management
router.get('/videos',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['published', 'draft', 'pending']),
    query('category').optional().isString()
  ],
  validateRequest,
  adminController.getVideos
);

router.get('/videos/pending',
  adminController.getPendingVideos
);

router.put('/videos/:id/approve',
  [param('id').isUUID()],
  validateRequest,
  adminController.approveVideo
);

router.put('/videos/:id/reject',
  [
    param('id').isUUID(),
    body('reason').optional().isString()
  ],
  validateRequest,
  adminController.rejectVideo
);

// Content management
router.get('/categories',
  adminController.getCategories
);

router.post('/categories',
  [
    body('name').notEmpty().isString(),
    body('slug').notEmpty().isString(),
    body('description').optional().isString()
  ],
  validateRequest,
  adminController.createCategory
);

router.put('/categories/:id',
  [
    param('id').isUUID(),
    body('name').optional().isString(),
    body('description').optional().isString()
  ],
  validateRequest,
  adminController.updateCategory
);

router.delete('/categories/:id',
  [param('id').isUUID()],
  validateRequest,
  adminController.deleteCategory
);

// Analytics
router.get('/analytics/overview',
  [
    query('period').optional().isIn(['day', 'week', 'month', 'year'])
  ],
  validateRequest,
  adminController.getAnalyticsOverview
);

router.get('/analytics/users',
  adminController.getUserAnalytics
);

router.get('/analytics/videos',
  adminController.getVideoAnalytics
);

router.get('/analytics/revenue',
  adminController.getRevenueAnalytics
);

// Reports
router.get('/reports',
  adminController.getReports
);

router.post('/reports/generate',
  [
    body('type').isIn(['users', 'videos', 'revenue', 'performance']),
    body('format').optional().isIn(['json', 'csv', 'pdf']),
    body('dateRange').optional().isObject()
  ],
  validateRequest,
  adminController.generateReport
);

// System health
router.get('/system/health',
  adminController.getSystemHealth
);

router.get('/system/metrics',
  adminController.getSystemMetrics
);

router.get('/system/logs',
  [
    query('level').optional().isIn(['error', 'warn', 'info', 'debug']),
    query('limit').optional().isInt({ min: 1, max: 1000 })
  ],
  validateRequest,
  adminController.getSystemLogs
);

// Configuration
router.get('/config',
  adminController.getConfig
);

router.put('/config',
  [
    body('maintenanceMode').optional().isBoolean(),
    body('maxUploadSize').optional().isInt(),
    body('allowedFormats').optional().isArray()
  ],
  validateRequest,
  adminController.updateConfig
);

// Audit logs
router.get('/audit-logs',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('userId').optional().isUUID(),
    query('action').optional().isString()
  ],
  validateRequest,
  adminController.getAuditLogs
);

module.exports = router;