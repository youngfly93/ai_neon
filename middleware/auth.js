const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - should be in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Create JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      isAdmin: user.isAdmin 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Verify JWT token and attach user to request
const verifyToken = async (req, res, next) => {
  try {
    // Get token from cookies or headers
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ error: '未登录或登录已过期' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: '需要管理员权限' });
  }
};

// Optional token verification (doesn't block if not logged in)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || 
                 (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue even if token verification fails
    next();
  }
};

module.exports = { 
  generateToken,
  verifyToken,
  isAdmin,
  optionalAuth,
  JWT_SECRET
}; 