#!/usr/bin/env node

// 重置管理员密码脚本
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

async function resetPassword() {
  console.log('🔐 重置管理员密码...');
  
  // 数据库连接配置
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'visit_tracker',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres123',
  });

  try {
    // 生成新的密码哈希
    const newPassword = 'password';
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('新密码:', newPassword);
    console.log('新哈希:', newHash);
    
    // 验证新哈希
    const isValid = await bcrypt.compare(newPassword, newHash);
    console.log('新哈希验证:', isValid ? '✅ 正确' : '❌ 错误');
    
    if (!isValid) {
      throw new Error('新生成的哈希验证失败');
    }
    
    // 更新数据库
    const result = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username, email',
      [newHash, 'admin']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ 密码更新成功');
      console.log('用户信息:', result.rows[0]);
    } else {
      console.log('❌ 未找到用户 admin');
    }
    
    // 再次验证数据库中的哈希
    const checkResult = await pool.query(
      'SELECT password_hash FROM users WHERE username = $1',
      ['admin']
    );
    
    if (checkResult.rows.length > 0) {
      const dbHash = checkResult.rows[0].password_hash;
      console.log('数据库中的哈希:', dbHash);
      
      const dbVerify = await bcrypt.compare(newPassword, dbHash);
      console.log('数据库哈希验证:', dbVerify ? '✅ 正确' : '❌ 错误');
    }
    
  } catch (error) {
    console.error('❌ 重置密码失败:', error);
  } finally {
    await pool.end();
  }
}

resetPassword();
