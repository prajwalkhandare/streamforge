const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models/user.model');
const { redisClient } = require('../config/redis');
const { AppError } = require('../utils/errors');
const { logger } = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, username } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        id: uuidv4(),
        email,
        username,
        password: hashedPassword,
        createdAt: new Date()
      });

      const token = this.generateToken(user);

      res.status(201).json({
        success: true,
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new AppError('Invalid credentials', 401);
      }

      const token = this.generateToken(user);

      res.json({
        success: true,
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      
      const user = await User.findOne({ id: decoded.userId });
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const token = this.generateToken(user);

      res.json({
        success: true,
        data: { token }
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res) {
    res.json({ success: true, message: 'Logged out successfully' });
  }

  async getCurrentUser(req, res) {
    res.json({
      success: true,
      data: { user: req.user }
    });
  }

  generateToken(user) {
    return jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );
  }
}

module.exports = new AuthController();