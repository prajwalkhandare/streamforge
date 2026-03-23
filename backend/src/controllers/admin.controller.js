const { query } = require('../config/database');
const { redisClient } = require('../config/redis');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const os = require('os');

class AdminController {
  // Dashboard Stats
  async getDashboardStats(req, res, next) {
    try {
      // Try cache first
      const cached = await redisClient.get('admin:dashboard:stats');
      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached)
        });
      }

      // Get user stats
      const userStats = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '24 hours' THEN 1 END) as active_users_today
        FROM users
      `);

      // Get video stats
      const videoStats = await query(`
        SELECT 
          COUNT(*) as total_videos,
          SUM(views) as total_views,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_videos_week
        FROM videos
      `);

      // Get watch hours
      const watchStats = await query(`
        SELECT 
          COUNT(*) as total_watches,
          SUM(progress) as total_watch_seconds,
          COUNT(DISTINCT user_id) as unique_watchers
        FROM watch_history
        WHERE watched_at > NOW() - INTERVAL '30 days'
      `);

      // Get recent activity
      const recentActivity = await query(`
        (SELECT 'new_user' as type, u.username, u.created_at as timestamp
         FROM users u
         ORDER BY u.created_at DESC
         LIMIT 5)
        UNION ALL
        (SELECT 'video_upload' as type, v.title as username, v.created_at as timestamp
         FROM videos v
         ORDER BY v.created_at DESC
         LIMIT 5)
        ORDER BY timestamp DESC
        LIMIT 10
      `);

      const stats = {
        users: userStats.rows[0],
        videos: videoStats.rows[0],
        watch: watchStats.rows[0],
        recentActivity: recentActivity.rows,
        updatedAt: new Date().toISOString()
      };

      // Cache for 5 minutes
      await redisClient.setex('admin:dashboard:stats', 300, JSON.stringify(stats));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Realtime Stats
  async getRealtimeStats(req, res, next) {
    try {
      const [activeUsers, currentViews, serverLoad] = await Promise.all([
        redisClient.get('realtime:active_users'),
        redisClient.get('realtime:current_views'),
        this.getServerLoad()
      ]);

      res.json({
        success: true,
        data: {
          activeUsers: parseInt(activeUsers) || 0,
          currentViews: parseInt(currentViews) || 0,
          serverLoad,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all users with filters
  async getUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (role) {
        whereClause += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (email ILIKE $${paramIndex} OR username ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const users = await query(
        `SELECT id, email, username, full_name, avatar_url, role, status, 
                email_verified, created_at, last_login, updated_at
         FROM users ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const total = await query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          users: users.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total.rows[0].count),
            pages: Math.ceil(total.rows[0].count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user details (admin view)
  async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;

      const user = await query(
        `SELECT u.*,
          COUNT(DISTINCT wh.video_id) as total_watch_count,
          COUNT(DISTINCT vl.video_id) as total_likes,
          COUNT(DISTINCT c.id) as total_comments
         FROM users u
         LEFT JOIN watch_history wh ON u.id = wh.user_id
         LEFT JOIN video_likes vl ON u.id = vl.user_id
         LEFT JOIN comments c ON u.id = c.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [id]
      );

      if (user.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const userData = user.rows[0];
      delete userData.password;

      // Get recent activity
      const recentActivity = await query(
        `(SELECT 'watch' as type, v.title, wh.watched_at as timestamp
         FROM watch_history wh
         JOIN videos v ON wh.video_id = v.id
         WHERE wh.user_id = $1
         ORDER BY wh.watched_at DESC
         LIMIT 5)
         UNION ALL
         (SELECT 'like' as type, v.title, vl.created_at as timestamp
          FROM video_likes vl
          JOIN videos v ON vl.video_id = v.id
          WHERE vl.user_id = $1
          ORDER BY vl.created_at DESC
          LIMIT 5)
         ORDER BY timestamp DESC
         LIMIT 10`,
        [id]
      );

      res.json({
        success: true,
        data: {
          user: userData,
          recentActivity: recentActivity.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user status (active/inactive/banned)
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      await query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, id]
      );

      logger.info(`User ${id} status updated to ${status} by admin`);

      res.json({
        success: true,
        message: `User status updated to ${status}`
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all videos (admin view)
  async getVideos(req, res, next) {
    try {
      const { page = 1, limit = 20, status, category } = req.query;

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      const videos = await query(
        `SELECT v.*,
          COUNT(DISTINCT wh.user_id) as watch_count,
          COUNT(DISTINCT vl.user_id) as like_count
         FROM videos v
         LEFT JOIN watch_history wh ON v.id = wh.video_id
         LEFT JOIN video_likes vl ON v.id = vl.video_id
         ${whereClause}
         GROUP BY v.id
         ORDER BY v.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const total = await query(
        `SELECT COUNT(*) FROM videos ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          videos: videos.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total.rows[0].count),
            pages: Math.ceil(total.rows[0].count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pending videos for approval
  async getPendingVideos(req, res, next) {
    try {
      const videos = await query(
        `SELECT v.*, u.username as uploaded_by
         FROM videos v
         JOIN users u ON v.uploaded_by = u.id
         WHERE v.status = 'pending'
         ORDER BY v.created_at ASC
         LIMIT 50`
      );

      res.json({
        success: true,
        data: { videos: videos.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Approve video
  async approveVideo(req, res, next) {
    try {
      const { id } = req.params;

      await query(
        `UPDATE videos 
         SET status = 'published', 
             published_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
        [id]
      );

      logger.info(`Video ${id} approved by admin`);

      res.json({
        success: true,
        message: 'Video approved and published'
      });
    } catch (error) {
      next(error);
    }
  }

  // Reject video
  async rejectVideo(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      await query(
        `UPDATE videos 
         SET status = 'rejected', 
             rejection_reason = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [reason, id]
      );

      logger.info(`Video ${id} rejected by admin`);

      res.json({
        success: true,
        message: 'Video rejected'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get categories
  async getCategories(req, res, next) {
    try {
      const result = await query(
        `SELECT c.*, COUNT(v.id) as video_count
         FROM categories c
         LEFT JOIN videos v ON c.name = v.category
         GROUP BY c.id, c.name
         ORDER BY c.name`
      );

      res.json({
        success: true,
        data: { categories: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create category
  async createCategory(req, res, next) {
    try {
      const { name, slug, description } = req.body;

      const existing = await query(
        'SELECT id FROM categories WHERE name = $1',
        [name]
      );

      if (existing.rows.length > 0) {
        throw new AppError('Category already exists', 409);
      }

      await query(
        `INSERT INTO categories (id, name, slug, description, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [uuidv4(), name, slug, description]
      );

      // Clear cache
      await redisClient.del('search:filters');

      logger.info(`Category created: ${name}`);

      res.status(201).json({
        success: true,
        message: 'Category created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update category
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      await query(
        `UPDATE categories 
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             updated_at = NOW()
         WHERE id = $3`,
        [name, description, id]
      );

      // Clear cache
      await redisClient.del('search:filters');

      res.json({
        success: true,
        message: 'Category updated'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete category
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      await query('DELETE FROM categories WHERE id = $1', [id]);

      // Clear cache
      await redisClient.del('search:filters');

      res.json({
        success: true,
        message: 'Category deleted'
      });
    } catch (error) {
      next(error);
    }
  }

  // Analytics Overview
  async getAnalyticsOverview(req, res, next) {
    try {
      const { period = 'week' } = req.query;

      let interval;
      switch (period) {
        case 'day':
          interval = "INTERVAL '24 hours'";
          break;
        case 'week':
          interval = "INTERVAL '7 days'";
          break;
        case 'month':
          interval = "INTERVAL '30 days'";
          break;
        case 'year':
          interval = "INTERVAL '365 days'";
          break;
        default:
          interval = "INTERVAL '7 days'";
      }

      // Daily user signups
      const userSignups = await query(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at > NOW() - ${interval}
        GROUP BY DATE(created_at)
        ORDER BY date
      `);

      // Daily video views
      const videoViews = await query(`
        SELECT DATE(watched_at) as date, COUNT(*) as count
        FROM watch_history
        WHERE watched_at > NOW() - ${interval}
        GROUP BY DATE(watched_at)
        ORDER BY date
      `);

      // Top videos
      const topVideos = await query(`
        SELECT v.id, v.title, v.thumbnail_url, v.views,
               COUNT(DISTINCT wh.user_id) as unique_watchers
        FROM videos v
        LEFT JOIN watch_history wh ON v.id = wh.video_id
        WHERE wh.watched_at > NOW() - ${interval}
        GROUP BY v.id, v.title, v.thumbnail_url, v.views
        ORDER BY v.views DESC
        LIMIT 10
      `);

      // User retention
      const retention = await query(`
        WITH user_activity AS (
          SELECT 
            user_id,
            MIN(watched_at) as first_watch,
            MAX(watched_at) as last_watch
          FROM watch_history
          WHERE watched_at > NOW() - INTERVAL '90 days'
          GROUP BY user_id
        )
        SELECT 
          COUNT(*) as total_active_users,
          COUNT(CASE WHEN last_watch > NOW() - INTERVAL '30 days' THEN 1 END) as retained_users
        FROM user_activity
      `);

      res.json({
        success: true,
        data: {
          period,
          userSignups: userSignups.rows,
          videoViews: videoViews.rows,
          topVideos: topVideos.rows,
          retention: {
            totalActive: retention.rows[0].total_active_users,
            retained: retention.rows[0].retained_users,
            rate: retention.rows[0].retained_users / retention.rows[0].total_active_users * 100
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // User Analytics
  async getUserAnalytics(req, res, next) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
          COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
          COUNT(CASE WHEN email_verified = true THEN 1 END) as verified_emails,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
          COUNT(CASE WHEN last_login > NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
          AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) as avg_account_age_days
        FROM users
      `);

      // User growth by month
      const growth = await query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as new_users
        FROM users
        WHERE created_at > NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month
      `);

      res.json({
        success: true,
        data: {
          summary: result.rows[0],
          growth: growth.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Video Analytics
  async getVideoAnalytics(req, res, next) {
    try {
      const result = await query(`
        SELECT 
          COUNT(*) as total_videos,
          SUM(views) as total_views,
          AVG(views) as avg_views,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
        FROM videos
      `);

      // Views by category
      const byCategory = await query(`
        SELECT category, COUNT(*) as video_count, SUM(views) as total_views
        FROM videos
        WHERE status = 'published'
        GROUP BY category
        ORDER BY total_views DESC
      `);

      res.json({
        success: true,
        data: {
          summary: result.rows[0],
          byCategory: byCategory.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Revenue Analytics
  async getRevenueAnalytics(req, res, next) {
    try {
      // This would be expanded with actual payment data
      res.json({
        success: true,
        data: {
          message: 'Revenue analytics - Implement with your payment provider'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Reports
  async getReports(req, res, next) {
    try {
      const reports = await query(`
        SELECT r.*, u.username as reported_by
        FROM reports r
        JOIN users u ON r.reporter_id = u.id
        ORDER BY r.created_at DESC
        LIMIT 100
      `);

      res.json({
        success: true,
        data: { reports: reports.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Generate Report
  async generateReport(req, res, next) {
    try {
      const { type, format = 'json', dateRange } = req.body;

      let data;
      let filename;

      switch (type) {
        case 'users':
          data = await this.generateUserReport(dateRange);
          filename = `users_report_${Date.now()}.${format}`;
          break;
        case 'videos':
          data = await this.generateVideoReport(dateRange);
          filename = `videos_report_${Date.now()}.${format}`;
          break;
        case 'revenue':
          data = await this.generateRevenueReport(dateRange);
          filename = `revenue_report_${Date.now()}.${format}`;
          break;
        case 'performance':
          data = await this.generatePerformanceReport(dateRange);
          filename = `performance_report_${Date.now()}.${format}`;
          break;
        default:
          throw new AppError('Invalid report type', 400);
      }

      logger.info(`Report generated: ${filename}`);

      res.json({
        success: true,
        data: {
          filename,
          type,
          format,
          generatedAt: new Date().toISOString(),
          data
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // System Health
  async getSystemHealth(req, res, next) {
    try {
      // Check database
      const dbStart = Date.now();
      await query('SELECT 1');
      const dbLatency = Date.now() - dbStart;

      // Check Redis
      const redisStart = Date.now();
      await redisClient.ping();
      const redisLatency = Date.now() - redisStart;

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: 'healthy',
            latency: `${dbLatency}ms`
          },
          redis: {
            status: 'healthy',
            latency: `${redisLatency}ms`
          },
          api: {
            status: 'healthy',
            uptime: process.uptime()
          }
        }
      };

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          status: 'degraded',
          timestamp: new Date().toISOString(),
          error: error.message
        }
      });
    }
  }

  // System Metrics
  async getSystemMetrics(req, res, next) {
    try {
      const metrics = {
        cpu: {
          cores: os.cpus().length,
          loadAvg: os.loadavg(),
          usage: await this.getCPUUsage()
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
        },
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  }

  // System Logs
  async getSystemLogs(req, res, next) {
    try {
      const { level, limit = 100 } = req.query;

      // This would fetch logs from your logging system
      // For now, return sample data
      res.json({
        success: true,
        data: {
          logs: [],
          message: 'Logs available through CloudWatch or logging service'
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get Configuration
  async getConfig(req, res, next) {
    try {
      const config = await redisClient.get('admin:config');

      res.json({
        success: true,
        data: config ? JSON.parse(config) : {
          maintenanceMode: false,
          maxUploadSize: 100 * 1024 * 1024, // 100MB
          allowedFormats: ['mp4', 'mkv', 'avi', 'mov']
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update Configuration
  async updateConfig(req, res, next) {
    try {
      const { maintenanceMode, maxUploadSize, allowedFormats } = req.body;

      const config = {
        maintenanceMode,
        maxUploadSize,
        allowedFormats,
        updatedAt: new Date().toISOString()
      };

      await redisClient.setex('admin:config', 86400, JSON.stringify(config));

      logger.info('System configuration updated');

      res.json({
        success: true,
        message: 'Configuration updated'
      });
    } catch (error) {
      next(error);
    }
  }

  // Audit Logs
  async getAuditLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, userId, action } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (userId) {
        whereClause += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      if (action) {
        whereClause += ` AND action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      const logs = await query(
        `SELECT * FROM audit_logs ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const total = await query(
        `SELECT COUNT(*) FROM audit_logs ${whereClause}`,
        params
      );

      res.json({
        success: true,
        data: {
          logs: logs.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(total.rows[0].count)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper Methods
  async getServerLoad() {
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    return {
      load1: loadAvg[0],
      load5: loadAvg[1],
      load15: loadAvg[2],
      cores: cpuCount,
      utilization: (loadAvg[0] / cpuCount * 100).toFixed(2)
    };
  }

  async getCPUUsage() {
    const start = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const end = process.cpuUsage(start);
    const total = (end.user + end.system) / 1000;
    return (total / 100).toFixed(2);
  }

  async generateUserReport(dateRange) {
    const { startDate, endDate } = dateRange || {};
    // Implement user report generation
    return { message: 'User report data' };
  }

  async generateVideoReport(dateRange) {
    return { message: 'Video report data' };
  }

  async generateRevenueReport(dateRange) {
    return { message: 'Revenue report data' };
  }

  async generatePerformanceReport(dateRange) {
    return { message: 'Performance report data' };
  }
}

module.exports = new AdminController();
