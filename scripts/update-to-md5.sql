-- 更新现有用户密码为MD5格式
-- password 的 MD5 哈希是: 5d41402abc4b2a76b9719d911017c592

UPDATE users 
SET password_hash = '5d41402abc4b2a76b9719d911017c592' 
WHERE username = 'admin';

-- 验证更新结果
SELECT username, email, password_hash, is_active, role 
FROM users 
WHERE username = 'admin';
