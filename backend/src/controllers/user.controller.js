const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { redisClient } = require('../config/redis');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { uploadToS3 } = require('../services/aws.service');
const bcrypt = require('bcryptjs');

class UserController {
  // Get user profile
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT u.*, 
          COUNT(DISTINCT wh.video_id) as watch_count,
          COUNT(DISTINCT vl.video_id) as likes_count,
          COUNT(DISTINCT ml.video_id) as my_list_count
         FROM users u
         LEFT JOIN watch_history wh ON u.id = wh.user_id
         LEFT JOIN video_likes vl ON u.id = vl.user_id
         LEFT JOIN my_list ml ON u.id = ml.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = result.rows[0];
      delete user.password;

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const { fullName, bio, language, notifications } = req.body;

      await query(
        `UPDATE users 
         SET full_name = COALESCE($1, full_name),
             bio = COALESCE($2, bio),
             language = COALESCE($3, language),
             notifications = COALESCE($4, notifications),
             updated_at = NOW()
         WHERE id = $5`,
        [fullName, bio, language, notifications, userId]
      );

      logger.info(`Profile updated for user: ${userId}`);

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Update avatar
  async updateAvatar(req, res, next) {
    try {
      const userId = req.user.userId;
      const file = req.file;

      if (!file) {
        throw new AppError('No file uploaded', 400);
      }

      const avatarUrl = await uploadToS3(file, 'avatars');

      await query(
        'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2',
        [avatarUrl, userId]
      );

      res.json({
        success: true,
        data: { avatarUrl }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get watch history
  async getWatchHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 20 } = req.query;

      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT wh.*, v.* 
         FROM watch_history wh
         JOIN videos v ON wh.video_id = v.id
         WHERE wh.user_id = $1
         ORDER BY wh.watched_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const total = await query(
        'SELECT COUNT(*) FROM watch_history WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        data: {
          history: result.rows,
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

  // Remove from watch history
  async removeFromHistory(req, res, next) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      await query(
        'DELETE FROM watch_history WHERE user_id = $1 AND video_id = $2',
        [userId, id]
      );

      res.json({
        success: true,
        message: 'Removed from history'
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear watch history
  async clearHistory(req, res, next) {
    try {
      const userId = req.user.userId;

      await query('DELETE FROM watch_history WHERE user_id = $1', [userId]);

      res.json({
        success: true,
        message: 'History cleared'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get my list
  async getMyList(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT ml.*, v.* 
         FROM my_list ml
         JOIN videos v ON ml.video_id = v.id
         WHERE ml.user_id = $1
         ORDER BY ml.created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: { videos: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Add to my list
  async addToMyList(req, res, next) {
    try {
      const userId = req.user.userId;
      const { videoId } = req.params;

      await query(
        `INSERT INTO my_list (id, user_id, video_id, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [uuidv4(), userId, videoId]
      );

      res.json({
        success: true,
        message: 'Added to my list'
      });
    } catch (error) {
      next(error);
    }
  }

  // Remove from my list
  async removeFromMyList(req, res, next) {
    try {
      const userId = req.user.userId;
      const { videoId } = req.params;

      await query(
        'DELETE FROM my_list WHERE user_id = $1 AND video_id = $2',
        [userId, videoId]
      );

      res.json({
        success: true,
        message: 'Removed from my list'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get preferences
  async getPreferences(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        'SELECT preferences FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        success: true,
        data: { preferences: result.rows[0]?.preferences || {} }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update preferences
  async updatePreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const preferences = req.body;

      await query(
        'UPDATE users SET preferences = $1, updated_at = NOW() WHERE id = $2',
        [preferences, userId]
      );

      res.json({
        success: true,
        message: 'Preferences updated'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user ratings
  async getUserRatings(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT ur.*, v.title, v.thumbnail_url
         FROM user_ratings ur
         JOIN videos v ON ur.video_id = v.id
         WHERE ur.user_id = $1
         ORDER BY ur.created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        data: { ratings: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Get all users
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 20, role, status } = req.query;

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

      const result = await query(
        `SELECT id, email, username, full_name, role, status, 
                email_verified, created_at, last_login
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
          users: result.rows,
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

  // Admin: Get user by ID
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT u.*, 
          COUNT(DISTINCT wh.video_id) as watch_count,
          COUNT(DISTINCT vl.video_id) as likes_count
         FROM users u
         LEFT JOIN watch_history wh ON u.id = wh.user_id
         LEFT JOIN video_likes vl ON u.id = vl.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = result.rows[0];
      delete user.password;

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Update user role
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      await query(
        'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
        [role, id]
      );

      logger.info(`User role updated: ${id} -> ${role}`);

      res.json({
        success: true,
        message: 'User role updated'
      });
    } catch (error) {
      next(error);
    }
  }

  // Admin: Delete user
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      await query('DELETE FROM users WHERE id = $1', [id]);

      logger.info(`User deleted: ${id}`);

      res.json({
        success: true,
        message: 'User deleted'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();