-- 创建数据库表结构

-- 网站表
CREATE TABLE IF NOT EXISTS websites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 访问记录表
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES websites(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL, -- 访客唯一标识
    session_id VARCHAR(255) NOT NULL, -- 会话标识
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
    duration INTEGER DEFAULT 0, -- 页面停留时间（秒）
    is_bounce BOOLEAN DEFAULT false, -- 是否跳出
    is_new_visitor BOOLEAN DEFAULT false, -- 是否新访客
    utm_source VARCHAR(255),
    utm_medium VARCHAR(255),
    utm_campaign VARCHAR(255),
    utm_term VARCHAR(255),
    utm_content VARCHAR(255)
);

-- 页面浏览量统计表（按天聚合）
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
);

-- 访客统计表（按天聚合）
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
);

-- 用户表（管理后台用户）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_visits_website_id ON visits(website_id);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visits_session_id ON visits(session_id);
CREATE INDEX IF NOT EXISTS idx_visits_time ON visits(visit_time);
CREATE INDEX IF NOT EXISTS idx_visits_page_url ON visits(page_url);
CREATE INDEX IF NOT EXISTS idx_daily_stats_website_date ON daily_stats(website_id, date);
CREATE INDEX IF NOT EXISTS idx_visitor_stats_website_date ON visitor_stats(website_id, date);

-- 插入默认数据 (密码: password)
INSERT INTO users (username, email, password_hash, role)
VALUES ('admin', 'admin@example.com', '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.jjAHfCxUKCLKZmSQOaHLLe8WpeH6', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 插入示例网站
INSERT INTO websites (name, domain, api_key)
VALUES ('Example Website', 'example.com', 'sk-demo1234567890abcdef1234567890abcdef123456')
ON CONFLICT (domain) DO NOTHING;
