const jwt = require('jsonwebtoken');
const { getDB } = require('../utils/database');

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 验证 JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 验证用户是否仍然存在且活跃
    const db = getDB();
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // 将用户信息添加到请求对象
    req.user = result.rows[0];
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

// 管理员权限检查
const adminAuth = async (req, res, next) => {
  try {
    // 先执行基本认证
    await auth(req, res, () => {
      // 检查是否为管理员
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
      }
      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = auth;
module.exports.adminAuth = adminAuth;
