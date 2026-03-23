const { query } = require('../config/database');
const { redisClient } = require('../config/redis');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class SearchController {
  // Main search endpoint
  async search(req, res, next) {
    try {
      const {
        q,
        type = 'all',
        category,
        genre,
        year,
        rating,
        page = 1,
        limit = 20,
        sort = 'relevance'
      } = req.query;

      const offset = (page - 1) * limit;
      const searchTerm = `%${q}%`;

      // Build search query based on type
      let searchQuery;
      let countQuery;
      const params = [searchTerm];
      let paramIndex = 2;

      if (type === 'all') {
        // Search both videos and users
        const videoResults = await this.searchVideos(q, category, genre, year, rating, sort, limit, offset);
        const userResults = await this.searchUsers(q, limit, offset);

        // Track search if user is logged in
        if (req.user) {
          await this.trackSearch(req.user.userId, q);
        }

        return res.json({
          success: true,
          data: {
            videos: videoResults.rows,
            users: userResults.rows,
            total: videoResults.count + userResults.count,
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit)
            }
          }
        });
      }

      // Specific type search
      switch (type) {
        case 'videos':
          searchQuery = this.buildVideoSearchQuery(category, genre, year, rating, sort);
          countQuery = this.buildVideoCountQuery(category, genre, year, rating);
          break;
        case 'users':
          searchQuery = this.buildUserSearchQuery();
          countQuery = 'SELECT COUNT(*) FROM users WHERE username ILIKE $1 OR full_name ILIKE $1';
          break;
        default:
          throw new AppError('Invalid search type', 400);
      }

      // Add search term to params
      const searchParams = [searchTerm];
      
      // Add filter params
      if (type === 'videos') {
        if (category) {
          searchParams.push(category);
          paramIndex++;
        }
        if (genre) {
          searchParams.push(genre);
          paramIndex++;
        }
        if (year) {
          searchParams.push(year);
          paramIndex++;
        }
        if (rating) {
          searchParams.push(rating);
          paramIndex++;
        }
      }

      // Add pagination
      searchParams.push(limit, offset);

      // Execute queries
      const results = await query(searchQuery, searchParams);
      const totalResult = await query(countQuery, [searchTerm]);

      // Track search if user is logged in
      if (req.user) {
        await this.trackSearch(req.user.userId, q);
      }

      // Cache results for popular searches
      if (results.rows.length > 0 && page === 1) {
        await this.cacheSearchResults(q, results.rows);
      }

      res.json({
        success: true,
        data: {
          [type]: results.rows,
          total: parseInt(totalResult.rows[0].count),
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(totalResult.rows[0].count / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Search videos
  async searchVideos(q, category, genre, year, rating, sort, limit, offset) {
    const searchTerm = `%${q}%`;
    let query = `
      SELECT v.*, 
             ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) as rank
      FROM videos v
      WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
    `;

    const params = [searchTerm];
    let paramIndex = 2;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (genre) {
      query += ` AND $${paramIndex} = ANY(genres)`;
      params.push(genre);
      paramIndex++;
    }

    if (year) {
      query += ` AND release_year = $${paramIndex}`;
      params.push(year);
      paramIndex++;
    }

    if (rating) {
      query += ` AND rating >= $${paramIndex}`;
      params.push(rating);
      paramIndex++;
    }

    // Sorting
    switch (sort) {
      case 'rating':
        query += ' ORDER BY rating DESC, rank DESC';
        break;
      case 'year':
        query += ' ORDER BY release_year DESC, rank DESC';
        break;
      case 'views':
        query += ' ORDER BY views DESC, rank DESC';
        break;
      case 'relevance':
      default:
        query += ' ORDER BY rank DESC, views DESC';
        break;
    }

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(query, params);
    return result;
  }

  // Search users
  async searchUsers(q, limit, offset) {
    const searchTerm = `%${q}%`;
    const result = await query(
      `SELECT id, username, full_name, avatar_url, bio, role
       FROM users 
       WHERE username ILIKE $1 OR full_name ILIKE $1
       ORDER BY 
         CASE 
           WHEN username ILIKE $2 THEN 1
           WHEN full_name ILIKE $2 THEN 2
           ELSE 3
         END
       LIMIT $3 OFFSET $4`,
      [searchTerm, q, limit, offset]
    );

    return result;
  }

  // Build video search query
  buildVideoSearchQuery(category, genre, year, rating, sort) {
    let query = `
      SELECT v.*, 
             ts_rank(to_tsvector('english', title || ' ' || COALESCE(description, '')), plainto_tsquery('english', $1)) as rank
      FROM videos v
      WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
    `;

    if (category) query += ` AND category = $2`;
    if (genre) query += ` AND $3 = ANY(genres)`;
    if (year) query += ` AND release_year = $4`;
    if (rating) query += ` AND rating >= $5`;

    switch (sort) {
      case 'rating':
        query += ' ORDER BY rating DESC, rank DESC';
        break;
      case 'year':
        query += ' ORDER BY release_year DESC, rank DESC';
        break;
      case 'views':
        query += ' ORDER BY views DESC, rank DESC';
        break;
      default:
        query += ' ORDER BY rank DESC, views DESC';
    }

    return query;
  }

  // Build video count query
  buildVideoCountQuery(category, genre, year, rating) {
    let query = `
      SELECT COUNT(*)
      FROM videos v
      WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', $1)
    `;

    if (category) query += ` AND category = $2`;
    if (genre) query += ` AND $3 = ANY(genres)`;
    if (year) query += ` AND release_year = $4`;
    if (rating) query += ` AND rating >= $5`;

    return query;
  }

  // Build user search query
  buildUserSearchQuery() {
    return `
      SELECT id, username, full_name, avatar_url, bio, role
      FROM users 
      WHERE username ILIKE $1 OR full_name ILIKE $1
      ORDER BY 
        CASE 
          WHEN username ILIKE $2 THEN 1
          WHEN full_name ILIKE $2 THEN 2
          ELSE 3
        END
    `;
  }

  // Get search suggestions (autocomplete)
  async getSuggestions(req, res, next) {
    try {
      const { q, limit = 5 } = req.query;

      // Try cache first
      const cacheKey = `search:suggestions:${q}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          data: { suggestions: JSON.parse(cached) }
        });
      }

      const searchTerm = `${q}%`;

      // Get video title suggestions
      const videoSuggestions = await query(
        `SELECT title as value, 'video' as type, 
                thumbnail_url as image, category
         FROM videos 
         WHERE title ILIKE $1
         ORDER BY views DESC
         LIMIT $2`,
        [searchTerm, limit]
      );

      // Get user suggestions
      const userSuggestions = await query(
        `SELECT username as value, 'user' as type,
                avatar_url as image, full_name as subtitle
         FROM users 
         WHERE username ILIKE $1 OR full_name ILIKE $1
         LIMIT $2`,
        [searchTerm, limit]
      );

      // Get category suggestions
      const categorySuggestions = await query(
        `SELECT DISTINCT category as value, 'category' as type
         FROM videos 
         WHERE category ILIKE $1
         LIMIT $2`,
        [searchTerm, limit]
      );

      const suggestions = [
        ...videoSuggestions.rows,
        ...userSuggestions.rows,
        ...categorySuggestions.rows
      ].slice(0, limit);

      // Cache for 1 hour
      await redisClient.setex(cacheKey, 3600, JSON.stringify(suggestions));

      res.json({
        success: true,
        data: { suggestions }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get trending searches
  async getTrendingSearches(req, res, next) {
    try {
      // Try cache first
      const cached = await redisClient.get('search:trending');
      if (cached) {
        return res.json({
          success: true,
          data: { trending: JSON.parse(cached) }
        });
      }

      // Get trending searches from last 24 hours
      const result = await query(
        `SELECT query, COUNT(*) as count
         FROM search_history
         WHERE searched_at > NOW() - INTERVAL '24 hours'
         GROUP BY query
         ORDER BY count DESC
         LIMIT 10`
      );

      // Cache for 6 hours
      await redisClient.setex('search:trending', 21600, JSON.stringify(result.rows));

      res.json({
        success: true,
        data: { trending: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user search history
  async getSearchHistory(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await query(
        `SELECT query, searched_at
         FROM search_history
         WHERE user_id = $1
         ORDER BY searched_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({
        success: true,
        data: { history: result.rows }
      });
    } catch (error) {
      next(error);
    }
  }

  // Clear search history
  async clearSearchHistory(req, res, next) {
    try {
      const userId = req.user.userId;

      await query(
        'DELETE FROM search_history WHERE user_id = $1',
        [userId]
      );

      res.json({
        success: true,
        message: 'Search history cleared'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get search filters (available categories, genres, years)
  async getSearchFilters(req, res, next) {
    try {
      // Try cache first
      const cached = await redisClient.get('search:filters');
      if (cached) {
        return res.json({
          success: true,
          data: { filters: JSON.parse(cached) }
        });
      }

      // Get all categories
      const categories = await query(
        'SELECT DISTINCT category, COUNT(*) as count FROM videos GROUP BY category'
      );

      // Get all genres
      const genres = await query(
        `SELECT unnest(genres) as genre, COUNT(*) as count 
         FROM videos 
         GROUP BY genre 
         ORDER BY count DESC`
      );

      // Get year range
      const years = await query(
        'SELECT MIN(release_year) as min_year, MAX(release_year) as max_year FROM videos'
      );

      const filters = {
        categories: categories.rows,
        genres: genres.rows,
        years: years.rows[0],
        ratings: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      };

      // Cache for 24 hours
      await redisClient.setex('search:filters', 86400, JSON.stringify(filters));

      res.json({
        success: true,
        data: { filters }
      });
    }