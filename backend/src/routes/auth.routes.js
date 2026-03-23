const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validateRequest } = require('../middleware/validateRequest');
const { authenticate } = require('../middleware/auth');

router.post('/register',
  [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('username').isLength({ min: 3 })
  ],
  validateRequest,
  authController.register
);

router.post('/login',
  [
    body('email').isEmail(),
    body('password').notEmpty()
  ],
  validateRequest,
  authController.login
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;
