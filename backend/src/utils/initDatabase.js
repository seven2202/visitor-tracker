const { getDB } = require('./database');
const bcrypt = require('bcryptjs');

const initDatabase = async () => {
  try {
    const db = getDB();
    
    console.log('🔍 检查数据库表结构...');
    
    // 检查是否已经初始化
    const tableCheck = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ 数据库已初始化');
      return;
    }
    
    console.log('🚀 开始初始化数据库...');
    
    // 创建网站表
    await db.query(`
      CREATE TABLE IF NOT EXISTS websites (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          domain VARCHAR(255) NOT NULL UNIQUE,
          api_key VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT true
      )
    `);
    
    // 创建访问记录表
    await db.query(`
      CREATE TABLE IF NOT EXISTS visits (
          id SERIAL PRIMARY KEY,
          website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
          visitor_id VARCHAR(255) NOT NULL,
          session_id VARCHAR(255) NOT NULL,
          page_url TEXT NOT NULL,
          page_title VARCHAR(500),
          referrer TEXT,
          user_agent TEXT,
          ip_address INET,
          country VARCHAR(100),
          city VARCHAR(100),
          browser VARCHAR(100),
          os VARCHAR(100),
          device VARCHAR(100),
          screen_resolution VARCHAR(50),
          language VARCHAR(10),
          timezone VARCHAR(50),
          visit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          duration INTEGER DEFAULT 0,
          is_bounce BOOLEAN DEFAULT false,
          is_new_visitor BOOLEAN DEFAULT false,
          utm_source VARCHAR(255),
          utm_medium VARCHAR(255),
          utm_campaign VARCHAR(255),
          utm_term VARCHAR(255),
          utm_content VARCHAR(255)
      )
    `);
    
    // 创建页面浏览量统计表
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_stats (
          id SERIAL PRIMARY KEY,
          website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          page_url TEXT NOT NULL,
          page_views INTEGER DEFAULT 0,
          unique_visitors INTEGER DEFAULT 0,
          bounce_rate DECIMAL(5,2) DEFAULT 0,
          avg_duration DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(website_id, date, page_url)
      )
    `);
    
    // 创建访客统计表
    await db.query(`
      CREATE TABLE IF NOT EXISTS visitor_stats (
          id SERIAL PRIMARY KEY,
          website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          total_visitors INTEGER DEFAULT 0,
          new_visitors INTEGER DEFAULT 0,
          returning_visitors INTEGER DEFAULT 0,
          total_sessions INTEGER DEFAULT 0,
          total_page_views INTEGER DEFAULT 0,
          avg_session_duration DECIMAL(10,2) DEFAULT 0,
          bounce_rate DECIMAL(5,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(website_id, date)
      )
    `);
    
    // 创建用户表
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建索引
    await db.query('CREATE INDEX IF NOT EXISTS idx_visits_website_id ON visits(website_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON visits(visitor_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_visits_session_id ON visits(session_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_visits_time ON visits(visit_time)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_visits_page_url ON visits(page_url)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_daily_stats_website_date ON daily_stats(website_id, date)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_visitor_stats_website_date ON visitor_stats(website_id, date)');
    
    console.log('📊 创建数据表完成');
    
    // 插入默认管理员用户
    const passwordHash = await bcrypt.hash('password', 10);
    await db.query(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', 'admin@example.com', passwordHash, 'admin']);
    
    // 插入示例网站
    await db.query(`
      INSERT INTO websites (name, domain, api_key)
      VALUES ($1, $2, $3)
      ON CONFLICT (domain) DO NOTHING
    `, ['Example Website', 'example.com', 'sk-demo1234567890abcdef1234567890abcdef123456']);
    
    console.log('✅ 数据库初始化完成！');
    console.log('👤 默认管理员: admin / password');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
};

module.exports = { initDatabase };
