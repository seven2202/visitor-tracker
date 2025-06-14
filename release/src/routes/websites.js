const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDB } = require('../utils/database');
const auth = require('../middleware/auth');
const { validateWebsite } = require('../middleware/validation');

const router = express.Router();

// 获取所有网站
router.get('/', auth, async (req, res) => {
  try {
    const db = getDB();
    
    const result = await db.query(`
      SELECT 
        w.*,
        COALESCE(today_stats.visits, 0) as today_visits,
        COALESCE(today_stats.unique_visitors, 0) as today_unique_visitors
      FROM websites w
      LEFT JOIN (
        SELECT 
          website_id,
          COUNT(*) as visits,
          COUNT(DISTINCT visitor_id) as unique_visitors
        FROM visits 
        WHERE DATE(visit_time) = CURRENT_DATE
        GROUP BY website_id
      ) today_stats ON w.id = today_stats.website_id
      WHERE w.is_active = true
      ORDER BY w.created_at DESC
    `);

    res.json({
      websites: result.rows
    });

  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取单个网站详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const result = await db.query(
      'SELECT * FROM websites WHERE id = $1 AND is_active = true',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({
      website: result.rows[0]
    });

  } catch (error) {
    console.error('Get website error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 创建新网站
router.post('/', auth, validateWebsite, async (req, res) => {
  try {
    const { name, domain } = req.body;
    const db = getDB();
    
    // 生成 OpenAI 风格的 API Key (sk-xxx)
    const randomString = uuidv4().replace(/-/g, '').substring(0, 48);
    const apiKey = `sk-${randomString}`;
    
    const result = await db.query(`
      INSERT INTO websites (name, domain, api_key)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, domain, apiKey]);

    res.status(201).json({
      website: result.rows[0]
    });

  } catch (error) {
    console.error('Create website error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Domain already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新网站
router.put('/:id', auth, validateWebsite, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain } = req.body;
    const db = getDB();
    
    const result = await db.query(`
      UPDATE websites 
      SET name = $1, domain = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND is_active = true
      RETURNING *
    `, [name, domain, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({
      website: result.rows[0]
    });

  } catch (error) {
    console.error('Update website error:', error);
    
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Domain already exists' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 重新生成 API Key
router.post('/:id/regenerate-key', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const randomString = uuidv4().replace(/-/g, '').substring(0, 48);
    const newApiKey = `sk-${randomString}`;
    
    const result = await db.query(`
      UPDATE websites 
      SET api_key = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING *
    `, [newApiKey, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({
      website: result.rows[0]
    });

  } catch (error) {
    console.error('Regenerate API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除网站（软删除）
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    const result = await db.query(`
      UPDATE websites 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_active = true
      RETURNING id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    res.json({
      message: 'Website deleted successfully'
    });

  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取网站统计概览
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    
    // 验证网站存在
    const websiteResult = await db.query(
      'SELECT id FROM websites WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (websiteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    // 获取今日统计
    const todayStats = await db.query(`
      SELECT 
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM visits 
      WHERE website_id = $1 
      AND DATE(visit_time) = CURRENT_DATE
    `, [id]);

    // 获取昨日统计
    const yesterdayStats = await db.query(`
      SELECT 
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM visits 
      WHERE website_id = $1 
      AND DATE(visit_time) = CURRENT_DATE - INTERVAL '1 day'
    `, [id]);

    // 获取本月统计
    const monthStats = await db.query(`
      SELECT 
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM visits 
      WHERE website_id = $1 
      AND DATE_TRUNC('month', visit_time) = DATE_TRUNC('month', CURRENT_DATE)
    `, [id]);

    // 获取总统计
    const totalStats = await db.query(`
      SELECT 
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions,
        MIN(visit_time) as first_visit
      FROM visits 
      WHERE website_id = $1
    `, [id]);

    res.json({
      today: todayStats.rows[0],
      yesterday: yesterdayStats.rows[0],
      thisMonth: monthStats.rows[0],
      total: totalStats.rows[0]
    });

  } catch (error) {
    console.error('Get website stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
