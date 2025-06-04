const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const axios = require('axios');

// Mock SMS verification (in production, use a real SMS service)
const verificationCodes = new Map();

// Phone number verification - Step 1: Send verification code
router.post('/phone/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ error: '请输入有效的手机号码' });
    }
    
    // Generate a random 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, you would send this code via SMS service
    // For this demo, we'll just store it in memory
    verificationCodes.set(phone, {
      code: verificationCode,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes expiry
    });
    
    console.log(`[DEV] Verification code for ${phone}: ${verificationCode}`);
    
    res.json({ 
      success: true, 
      message: '验证码已发送',
      // In production, don't send the code in the response
      code: verificationCode // Remove in production!
    });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: '发送验证码失败' });
  }
});

// Phone number verification - Step 2: Verify code and login/register
router.post('/phone/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.status(400).json({ error: '手机号和验证码不能为空' });
    }
    
    // Get the stored verification data
    const verificationData = verificationCodes.get(phone);
    
    if (!verificationData) {
      return res.status(400).json({ error: '请先获取验证码' });
    }
    
    if (Date.now() > verificationData.expiresAt) {
      verificationCodes.delete(phone);
      return res.status(400).json({ error: '验证码已过期，请重新获取' });
    }
    
    if (verificationData.code !== code) {
      return res.status(400).json({ error: '验证码错误' });
    }
    
    // Verification successful, clear the code
    verificationCodes.delete(phone);
    
    // Find or create user
    let user = await User.findOne({ phone });
    
    if (!user) {
      // Create new user
      user = new User({
        phone,
        phoneVerified: true,
        username: `user_${Date.now().toString().slice(-6)}` // Generate a username
      });
      await user.save();
    } else {
      // Update existing user
      user.phoneVerified = true;
      user.lastLogin = Date.now();
      await user.save();
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set cookie and send response
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        phone: user.phone,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    console.error('Error verifying phone:', error);
    res.status(500).json({ error: '验证手机号失败' });
  }
});

// WeChat login - Get QR code (simulate for development)
router.get('/wechat/qrcode', (req, res) => {
  // In production, get a real QR code from WeChat Open Platform
  // This is just a mock response
  res.json({
    success: true,
    qrCodeUrl: 'https://example.com/mock-wechat-qr-code',
    state: `wechat_auth_${Date.now()}`
  });
});

// WeChat login - OAuth callback
router.get('/wechat/callback', async (req, res) => {
  try {
    // In production, this would handle the OAuth callback from WeChat
    // Redirect with a parameter to tell the frontend to close the popup/redirect
    res.redirect('/login?wechatAuth=success');
  } catch (error) {
    console.error('WeChat login error:', error);
    res.redirect('/login?wechatAuth=error');
  }
});

// Mock WeChat login (for development only)
router.post('/wechat/mock-login', async (req, res) => {
  try {
    const { mockWechatId, mockUserInfo } = req.body;
    
    if (!mockWechatId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // Find or create user
    let user = await User.findOne({ wechatId: mockWechatId });
    
    if (!user) {
      // Create new user
      user = new User({
        wechatId: mockWechatId,
        username: mockUserInfo?.nickname || `wechat_user_${Date.now().toString().slice(-6)}`,
        avatar: mockUserInfo?.avatar || '',
      });
      await user.save();
    } else {
      // Update last login
      user.lastLogin = Date.now();
      await user.save();
    }
    
    // Generate JWT token
    const token = generateToken(user);
    
    // Set cookie and send response
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (error) {
    console.error('Mock WeChat login error:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    // Get token from cookies or headers
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.json({ loggedIn: false });
    }
    
    try {
      // Verify token
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = require('jsonwebtoken').verify(token, JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.json({ loggedIn: false });
      }
      
      // Return user info
      return res.json({
        loggedIn: true,
        user: {
          id: user._id,
          username: user.username,
          phone: user.phone,
          avatar: user.avatar,
          isAdmin: user.isAdmin
        }
      });
    } catch (error) {
      return res.json({ loggedIn: false });
    }
  } catch (error) {
    console.error('Error getting user info:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: '已退出登录' });
});

module.exports = router; 