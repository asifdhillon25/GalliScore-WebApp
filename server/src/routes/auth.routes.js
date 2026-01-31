const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, commonValidators } = require('../middleware/validation.middleware');
const { auth } = require('../middleware/auth.middleware');

// Public routes
router.post(
  '/register',
  validate(commonValidators.registerUser),
  authController.register
);

router.post(
  '/login',
  validate(commonValidators.loginUser),
  authController.login
);

router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
router.put('/change-password', auth, authController.changePassword);
router.post('/logout', auth, authController.logout);

module.exports = router;