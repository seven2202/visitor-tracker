#!/usr/bin/env node

// 测试密码验证脚本
const bcrypt = require('./node_modules/bcryptjs');

// 数据库中的密码哈希
const storedHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.jjAHfCxUKCLKZmSQOaHLLe8WpeH6';

// 测试密码
const testPasswords = ['password', 'admin', 'Password', '123456', 'password123'];

console.log('🔐 密码验证测试');
console.log('================');
console.log('存储的哈希:', storedHash);
console.log('');

async function testPassword(password) {
  try {
    const isValid = await bcrypt.compare(password, storedHash);
    console.log(`密码 "${password}": ${isValid ? '✅ 正确' : '❌ 错误'}`);
    return isValid;
  } catch (error) {
    console.log(`密码 "${password}": ❌ 验证出错 - ${error.message}`);
    return false;
  }
}

async function main() {
  for (const password of testPasswords) {
    await testPassword(password);
  }
  
  console.log('');
  console.log('🔍 生成新的密码哈希测试:');
  
  // 生成新的 'password' 哈希用于对比
  const newHash = await bcrypt.hash('password', 10);
  console.log('新生成的 password 哈希:', newHash);
  
  // 验证新哈希
  const isNewHashValid = await bcrypt.compare('password', newHash);
  console.log('新哈希验证结果:', isNewHashValid ? '✅ 正确' : '❌ 错误');
}

main().catch(console.error);
