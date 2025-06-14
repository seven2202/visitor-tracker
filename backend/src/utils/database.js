const { Pool } = require('pg');

let pool;

const connectDB = async () => {
  try {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'visit_tracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // 测试连接
    await pool.query('SELECT NOW()');
    console.log('Database connection established');
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

const closeDB = async () => {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB
};
