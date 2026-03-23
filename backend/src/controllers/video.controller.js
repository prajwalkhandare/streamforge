const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { redisClient } = require('../config/redis');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const { uploadToS3, getSignedUrl } = require('../services/aws.service');

class VideoController {
  // Get all videos with pagination and filters
  async getVideos(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        genre,
        year,
        sort = 'recent'
      } = req.query;

      const offset = (page - 1) * limit;

      // Build query
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (category) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (genre) {
        whereClause += ` AND $${paramIndex} = ANY(genres)`;
        params.push(genre);
        paramIndex++;
      }

      if (year) {
        whereClause += ` AND release_year = $${paramIndex}`;
        params.push(year);
        paramIndex++;
      }

      // Sorting
      let orderBy = 'ORDER BY ';
      switch (sort) {
        case 'popular':
          orderBy += 'views DESC';
          break;
        case 'rating':
          orderBy += 'rating DESC';
          break;
        case 'recent':
        default:
          orderBy += 'created_at DESC';
          break;
      }

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM videos ${whereClause}`,
        params
      );
      const total = parseInt(countResult.rows[0].count);

      // Get videos
      const result = await query(
        `SELECT * FROM videos ${whereClause} ${orderBy} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      // Generate signed URLs for thumbnails
      const videos = await Promise.all(
        result.rows.map(async (video) => {
          if (video.thumbnail_url) {
            video.thumbnail_url = await getSignedUrl(video.thumbnail_url);
          }
          return video;
        })
      );

      res.json({
        success: true,
        data: {
          videos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get featured videos
  async getFeaturedVideos(req, res, next) {
    try {
      // Try cache first
      const cached = await redisClient.get('featured_videos');
      if (cached) {
        return res.json({
          success: true,
          data: { videos: JSON.parse(cached) }
        });
      }

      const result = await query(
        `SELECT * FROM videos 
         WHERE is_featured = true 
         ORDER BY created_at DESC 
         LIMIT 10`
      );

      // Cache for 1 hour
      await redisClient.setex('featured_videos', 3600, JSON.stringify(result.rows));

      res.json({
        success: true,
        data: { videos: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get trending videos
  async getTrendingVideos(req, res, next) {
    try {
      const result = await query(
        `SELECT * FROM videos 
         ORDER BY views DESC, rating DESC 
         LIMIT 20`
      );

      res.json({
        success: true,
        data: { videos: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get video by ID
  async getVideoById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await query(
        `SELECT v.*, 
          COUNT(DISTINCT wh.id) as watch_count,
          AVG(ur.rating) as avg_rating
         FROM videos v
         LEFT JOIN watch_history wh ON v.id = wh.video_id
         LEFT JOIN user_ratings ur ON v.id = ur.video_id
         WHERE v.id = $1
         GROUP BY v.id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError('Video not found', 404);
      }

      const video = result.rows[0];

      // Get related videos
      const related = await query(
        `SELECT * FROM videos 
         WHERE category = $1 AND id != $2 
         LIMIT 10`,
        [video.category, id]
      );

      // Get comments
      const comments = await query(
        `SELECT c.*, u.username, u.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.video_id = $1
         ORDER BY c.created_at DESC
         LIMIT 50`,
        [id]
      );

      res.json({
        success: true,
        data: {
          video,
          related: related.rows,
          comments: comments.rows
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Watch video (increment views and track history)
  async watchVideo(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      // Increment view count
      await query(
        'UPDATE videos SET views = views + 1 WHERE id = $1',
        [id]
      );

      // Track in watch history if user is logged in
      if (userId) {
        await query(
          `INSERT INTO watch_history (id, user_id, video_id, watched_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, video_id) 
           DO UPDATE SET watched_at = NOW()`,
          [uuidv4(), userId, id]
        );
      }

      // Get video stream URL
      const video = await query('SELECT * FROM videos WHERE id = $1', [id]);
      
      // Generate signed URL for video stream (expires in 1 hour)
      const streamUrl = await getSignedUrl(video.rows[0].video_url, 3600);

      res.json({
        success: true,
        data: {
          streamUrl,
          expiresIn: 3600
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Like video
  async likeVideo(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await query(
        `INSERT INTO video_likes (id, user_id, video_id, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT DO NOTHING`,
        [uuidv4(), userId, id]
      );

      // Update likes count
      await query(
        'UPDATE videos SET likes = likes + 1 WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Video liked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Unlike video
  async unlikeVideo(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await query(
        'DELETE FROM video_likes WHERE user_id = $1 AND video_id = $2',
        [userId, id]
      );

      await query(
        'UPDATE videos SET likes = likes - 1 WHERE id = $1',
        [id]
      );

      res.json({
        success: true,
        message: 'Video unliked successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get related videos
  async getRelatedVideos(req, res, next) {
    try {
      const { id } = req.params;

      const video = await query('SELECT category, genres FROM videos WHERE id = $1', [id]);
      
      if (video.rows.length === 0) {
        throw new AppError('Video not found', 404);
      }

      const { category, genres } = video.rows[0];

      const result = await query(
        `SELECT * FROM videos 
         WHERE (category = $1 OR genres && $2) 
           AND id != $3
         ORDER BY views DESC
         LIMIT 10`,
        [category, genres, id]
      );

      res.json({
        success: true,
        data: { videos: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create video (admin only)
  async createVideo(req, res, next) {
    try {
      const {
        title,
        description,
        category,
        genres,
        releaseYear,
        duration,
        rating
      } = req.body;

      const files = req.files;

      if (!files || !files.video || !files.thumbnail) {
        throw new AppError('Video and thumbnail are required', 400);
      }

      // Upload to S3
      const videoUrl = await uploadToS3(files.video[0], 'videos');
      const thumbnailUrl = await uploadToS3(files.thumbnail[0], 'thumbnails');

      const id = uuidv4();

      await query(
        `INSERT INTO videos (
          id, title, description, category, genres, 
          release_year, duration, rating, video_url, 
          thumbnail_url, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          id, title, description, category, genres,
          releaseYear, duration, rating, videoUrl, thumbnailUrl
        ]
      );

      // Clear cache
      await redisClient.del('featured_videos');

      logger.info(`Video created: ${title} (${id})`);

      res.status(201).json({
        success: true,
        data: { id, title, message: 'Video created successfully' }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update video (admin only)
  async updateVideo(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined) {
          fields.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }

      fields.push('updated_at = NOW()');
      values.push(id);

      await query(
        `UPDATE videos SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      // Clear cache
      await redisClient.del('featured_videos');

      res.json({
        success: true,
        message: 'Video updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete video (admin only)
  async deleteVideo(req, res, next) {
    try {
      const { id } = req.params;

      await query('DELETE FROM videos WHERE id = $1', [id]);

      // Clear cache
      await redisClient.del('featured_videos');

      logger.info(`Video deleted: ${id}`);

      res.json({
        success: true,
        message: 'Video deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VideoController();