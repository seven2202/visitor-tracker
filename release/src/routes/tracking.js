const express = require('express');
const { v4: uuidv4 } = require('uuid');
const geoip = require('geoip-lite');
// const UserAgent = require('user-agents'); // 暂时注释掉，使用简化版本
const { getDB } = require('../utils/database');
const { cache } = require('../utils/redis');
const { validateTrackingData } = require('../middleware/validation');

const router = express.Router();

// 访问统计接口
router.post('/', validateTrackingData, async (req, res) => {
  try {
    const {
      apiKey,
      url,
      title,
      referrer,
      visitorId,
      sessionId,
      userAgent,
      language,
      timezone,
      screenResolution,
      duration,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = req.body;

    const db = getDB();
    const ip = req.ip || req.connection.remoteAddress;

    // 验证 API Key
    const websiteResult = await db.query(
      'SELECT id, domain FROM websites WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );

    if (websiteResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const website = websiteResult.rows[0];

    // 解析地理位置
    const geo = geoip.lookup(ip);
    const country = geo ? geo.country : null;
    const city = geo ? geo.city : null;

    // 解析 User Agent (简化版本)
    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Unknown';

    if (userAgent) {
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iOS')) os = 'iOS';

      if (userAgent.includes('Mobile')) device = 'Mobile';
      else if (userAgent.includes('Tablet')) device = 'Tablet';
      else device = 'Desktop';
    }

    // 检查是否为新访客
    const visitorCacheKey = `visitor:${website.id}:${visitorId}`;
    const isNewVisitor = !(await cache.get(visitorCacheKey));
    
    if (isNewVisitor) {
      await cache.set(visitorCacheKey, true, 86400 * 30); // 30天过期
    }

    // 插入访问记录
    const visitResult = await db.query(`
      INSERT INTO visits (
        website_id, visitor_id, session_id, page_url, page_title, referrer,
        user_agent, ip_address, country, city, browser, os, device,
        screen_resolution, language, timezone, duration, is_new_visitor,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
      RETURNING id
    `, [
      website.id, visitorId, sessionId, url, title, referrer,
      userAgent, ip, country, city, browser, os, device,
      screenResolution, language, timezone, duration || 0, isNewVisitor,
      utmSource, utmMedium, utmCampaign, utmTerm, utmContent
    ]);

    // 实时统计缓存更新
    const today = new Date().toISOString().split('T')[0];
    const statsKey = `stats:${website.id}:${today}`;
    
    await Promise.all([
      cache.incr(`${statsKey}:pageviews`),
      cache.incr(`${statsKey}:visitors:${visitorId}`, 86400),
      isNewVisitor && cache.incr(`${statsKey}:new_visitors`)
    ].filter(Boolean));

    res.status(200).json({ 
      success: true, 
      visitId: visitResult.rows[0].id 
    });

  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 页面离开时更新停留时间
router.put('/duration/:visitId', async (req, res) => {
  try {
    const { visitId } = req.params;
    const { duration } = req.body;

    const db = getDB();
    
    await db.query(
      'UPDATE visits SET duration = $1 WHERE id = $2',
      [duration, visitId]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Duration update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取实时在线用户数
router.get('/online/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;
    const db = getDB();

    // 验证 API Key
    const websiteResult = await db.query(
      'SELECT id FROM websites WHERE api_key = $1 AND is_active = true',
      [apiKey]
    );

    if (websiteResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const websiteId = websiteResult.rows[0].id;

    // 获取最近5分钟的活跃用户
    const onlineResult = await db.query(`
      SELECT COUNT(DISTINCT visitor_id) as online_users
      FROM visits 
      WHERE website_id = $1 
      AND visit_time > NOW() - INTERVAL '5 minutes'
    `, [websiteId]);

    res.status(200).json({
      onlineUsers: parseInt(onlineResult.rows[0].online_users) || 0
    });

  } catch (error) {
    console.error('Online users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
