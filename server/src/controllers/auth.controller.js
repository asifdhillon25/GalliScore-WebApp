const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User.model');
const Player = require('../models/Player.model');
const { 
  AppError, 
  ValidationError, 
  UnauthorizedError,
  NotFoundError 
} = require('../middleware/error.middleware');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'galliscore-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate refresh token
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

// Auth Controller
const authController = {
  // Register new user
  register: async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, phoneNumber, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }]
      });

      if (existingUser) {
        throw new ValidationError('User already exists with this email or username');
      }

      // Create user
      const user = await User.create({
        username,
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role: role || 'player'
      });

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken();

      // Save refresh token to user
      user.refreshToken = refreshToken;
      await user.save();

      // Remove sensitive data from response
      const userResponse = user.toJSON();

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: userResponse,
          token,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new UnauthorizedError('Account is inactive. Please contact support.');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update last active
      user.lastActive = new Date();
      await user.save();

      // Generate tokens
      const token = generateToken(user._id);
      const refreshToken = generateRefreshToken();

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Remove sensitive data from response
      const userResponse = user.toJSON();

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token,
          refreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('playerProfile', 'displayName firstName lastName jerseyNumber')
        .select('-password -refreshToken -verificationToken -resetPasswordToken');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const { firstName, lastName, phoneNumber, profileImage, preferences } = req.body;
      const userId = req.user._id;

      // Find and update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          firstName,
          lastName,
          phoneNumber,
          profileImage,
          preferences,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      ).select('-password -refreshToken -verificationToken -resetPasswordToken');

      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;

      // Find user with password
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      
      if (!isPasswordValid) {
        throw new ValidationError('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      // Find user by refresh token
      const user = await User.findOne({ refreshToken });
      
      if (!user) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken();

      // Update refresh token
      user.refreshToken = newRefreshToken;
      await user.save();

      res.status(200).json({
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Logout
  logout: async (req, res, next) => {
    try {
      const userId = req.user._id;

      // Clear refresh token
      await User.findByIdAndUpdate(userId, {
        refreshToken: null
      });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Request password reset
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal that user doesn't exist for security
        return res.status(200).json({
          success: true,
          message: 'If an account exists with this email, you will receive a password reset link'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = Date.now() + 3600000; // 1 hour

      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpires;
      await user.save();

      // In production, send email with reset link
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      
      console.log('Password reset URL:', resetUrl); // For development only

      res.status(200).json({
        success: true,
        message: 'Password reset email sent',
        data: { resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined }
      });
    } catch (error) {
      next(error);
    }
  },

  // Reset password
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      // Find user by reset token
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      });

      if (!user) {
        throw new ValidationError('Invalid or expired reset token');
      }

      // Update password
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      next(error);
    }
  },

  // Verify email
  verifyEmail: async (req, res, next) => {
    try {
      const { token } = req.params;

      const user = await User.findOne({
        verificationToken: token
      });

      if (!user) {
        throw new ValidationError('Invalid verification token');
      }

      // Mark email as verified
      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;