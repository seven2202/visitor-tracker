// 简单的密码测试脚本
console.log('测试密码验证...');

// 模拟 bcrypt 验证
const testHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.jjAHfCxUKCLKZmSQOaHLLe8WpeH6';
const testPassword = 'password';

console.log('存储的哈希:', testHash);
console.log('测试密码:', testPassword);

// 这个哈希是通过以下方式生成的：
// bcrypt.hash('password', 10)
// 应该验证为 true

console.log('');
console.log('请在容器中运行以下命令来验证:');
console.log('docker-compose -f docker-compose.prod.yml exec app node -e "');
console.log('const bcrypt = require(\'bcryptjs\');');
console.log('bcrypt.compare(\'password\', \'$2a$10$CwTycUXWue0Thq9StjUM0uJ8.jjAHfCxUKCLKZmSQOaHLLe8WpeH6\').then(result => {');
console.log('  console.log(\'密码验证结果:\', result);');
console.log('}).catch(err => console.error(\'错误:\', err));');
console.log('"');
