const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getDB } = require('../utils/database');
const { validateUserLogin, validateUserRegistration } = require('../middleware/validation');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// MD5 密码哈希函数
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// 用户登录
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`🔐 Login attempt for username: ${username}`);

    const db = getDB();

    // 查找用户
    console.log(`📊 Executing query: SELECT * FROM users WHERE username = '${username}' AND is_active = true`);
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

    console.log(`📋 Query result: Found ${result.rows.length} users`);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`👤 User found: ID=${user.id}, Username=${user.username}, Email=${user.email}, Active=${user.is_active}, Role=${user.role}`);
      console.log(`🔑 Password hash from DB: ${user.password_hash}`);
    }

    if (result.rows.length === 0) {
      console.log(`❌ No user found with username: ${username}`);
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const user = result.rows[0];

    // 验证密码 (使用MD5)
    console.log(`🔍 Comparing password '${password}' with hash '${user.password_hash}'`);

    // 生成输入密码的MD5哈希
    const inputPasswordHash = hashPassword(password);
    console.log(`� Input password MD5: ${inputPasswordHash}`);
    console.log(`� Stored password hash: ${user.password_hash}`);

    const isValidPassword = inputPasswordHash === user.password_hash;
    console.log(`✅ Password validation result: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log(`❌ Password incorrect for user: ${username}`);
      return res.status(401).json({ error: 'Password is incorrect' });
    }

    // 生成 JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // 更新最后登录时间
    await db.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 用户注册（仅管理员可用）
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const db = getDB();

    // 检查用户名是否已存在
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // 加密密码 (使用MD5)
    const passwordHash = hashPassword(password);

    // 创建用户
    const result = await db.query(`
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, email, role, created_at
    `, [username, email, passwordHash]);

    const newUser = result.rows[0];

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 验证 token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const db = getDB();

    // 验证用户是否仍然存在且活跃
    const result = await db.query(
      'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      valid: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 修改密码
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const db = getDB();

    // 获取用户信息
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // 验证当前密码 (使用MD5)
    const currentPasswordHash = hashPassword(currentPassword);
    const isValidPassword = currentPasswordHash === user.password_hash;
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // 加密新密码 (使用MD5)
    const newPasswordHash = hashPassword(newPassword);

    // 更新密码
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, decoded.userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
