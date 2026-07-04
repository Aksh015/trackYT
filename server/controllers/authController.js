const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isValidEmail, isValidPassword, isValidUsername } = require('../utils/validators');
const redisClient = require('../config/redis');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

/**
 * Generate a JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/auth/register
 * Create a new user account and send OTP.
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.',
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters (letters, numbers, underscores only).',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address.',
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
    }

    let user = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (user) {
      if (user.isEmailVerified) {
        const field = user.email === email ? 'email' : 'username';
        return res.status(409).json({
          success: false,
          message: `A user with that ${field} already exists.`,
        });
      } else {
        // User exists but hasn't verified their email.
        // We will update their password (in case they typed a new one) and resend the OTP.
        user.passwordHash = password; // pre-save hook will hash this
        await user.save();
      }
    } else {
      user = await User.create({
        username,
        email,
        passwordHash: password, // pre-save hook will hash this
        isEmailVerified: false,
      });
    }

    // Generate OTP and save to Redis with 4-minute TTL
    const otp = generateOTP();
    await redisClient.setEx(`otp:${user._id}`, 240, otp);
    await redisClient.setEx(`otp_attempts:${user._id}`, 240, '0');

    // Send the email
    await emailService.sendOTP(user.email, otp);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: {
        userId: user._id,
        email: user.email,
        requiresVerification: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify the OTP sent to email
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({
        success: false,
        message: 'userId and otp are required.',
      });
    }

    // Check attempts
    const attemptsStr = await redisClient.get(`otp_attempts:${userId}`);
    const attempts = parseInt(attemptsStr || '0', 10);

    if (attempts >= 4) {
      await redisClient.del(`otp:${userId}`);
      await redisClient.del(`otp_attempts:${userId}`);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. OTP has been invalidated. Please request a new one.',
      });
    }

    // Check OTP
    const storedOtp = await redisClient.get(`otp:${userId}`);
    if (!storedOtp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is invalid or has expired.',
      });
    }

    if (storedOtp !== otp) {
      await redisClient.incr(`otp_attempts:${userId}`);
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please try again.',
      });
    }

    // OTP is valid!
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isEmailVerified = true;
    await user.save();

    // Clean up Redis
    await redisClient.del(`otp:${userId}`);
    await redisClient.del(`otp_attempts:${userId}`);

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/resend-otp
 * Resend OTP to the user's email
 */
const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    const otp = generateOTP();
    await redisClient.setEx(`otp:${user._id}`, 240, otp);
    await redisClient.setEx(`otp_attempts:${user._id}`, 240, '0');

    await emailService.sendOTP(user.email, otp);

    res.json({
      success: true,
      message: 'A new OTP has been sent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and return token.
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        requiresVerification: true,
        userId: user._id,
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful.',
      data: {
        user: user.toJSON(),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/profile
 * Get current authenticated user's profile.
 */
const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: { user: req.user },
  });
};

const cloudinary = require('../config/cloudinary');

/**
 * PUT /api/auth/profile
 * Update user profile (username, avatar)
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id; // from auth middleware
    const { username } = req.body;
    const file = req.file;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Validate and update username
    if (username && username !== user.username) {
      if (!isValidUsername(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-30 characters (letters, numbers, underscores only).',
        });
      }
      // Check if username is taken
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username is already taken.' });
      }
      user.username = username;
    }

    // Upload new avatar if file provided
    if (file) {
      const uploadStream = () => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'trackyt_avatars' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          stream.end(file.buffer);
        });
      };

      const result = await uploadStream();
      user.profilePicURL = result.secure_url;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: user.toJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Blacklist the current JWT in Redis so it can't be reused.
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Decode without verifying to get the expiry time
      const decoded = require('jsonwebtoken').decode(token);
      if (decoded && decoded.exp) {
        // TTL = seconds remaining until token naturally expires
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          // Store in Redis blacklist until the token would have expired anyway
          await redisClient.setEx(`blacklist:${token}`, ttl, '1');
        }
      }
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, verifyOtp, resendOtp, updateProfile, logout };
