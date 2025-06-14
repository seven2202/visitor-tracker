const express = require('express');
const moment = require('moment');
const { getDB } = require('../utils/database');
const { cache } = require('../utils/redis');
const auth = require('../middleware/auth');

const router = express.Router();

// 获取网站概览统计
router.get('/overview/:websiteId', auth, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { startDate, endDate } = req.query;
    
    const db = getDB();
    
    // 验证网站权限
    const websiteResult = await db.query(
      'SELECT id FROM websites WHERE id = $1',
      [websiteId]
    );
    
    if (websiteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Website not found' });
    }

    const start = startDate ? moment(startDate) : moment().subtract(30, 'days');
    const end = endDate ? moment(endDate) : moment();

    // 获取基础统计
    const statsQuery = `
      SELECT 
        COUNT(*) as total_visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as total_sessions,
        AVG(duration) as avg_duration,
        SUM(CASE WHEN is_new_visitor = true THEN 1 ELSE 0 END) as new_visitors
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
    `;

    const statsResult = await db.query(statsQuery, [
      websiteId, 
      start.format('YYYY-MM-DD'), 
      end.format('YYYY-MM-DD 23:59:59')
    ]);

    const stats = statsResult.rows[0];

    // 获取跳出率
    const bounceQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN session_pages = 1 THEN 1 ELSE 0 END) as bounce_sessions
      FROM (
        SELECT session_id, COUNT(*) as session_pages
        FROM visits 
        WHERE website_id = $1 
        AND visit_time BETWEEN $2 AND $3
        GROUP BY session_id
      ) session_stats
    `;

    const bounceResult = await db.query(bounceQuery, [
      websiteId,
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD 23:59:59')
    ]);

    const bounceData = bounceResult.rows[0];
    const bounceRate = bounceData.total_sessions > 0 
      ? (bounceData.bounce_sessions / bounceData.total_sessions * 100).toFixed(2)
      : 0;

    // 获取热门页面
    const topPagesQuery = `
      SELECT 
        page_url,
        page_title,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        AVG(duration) as avg_duration
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      GROUP BY page_url, page_title
      ORDER BY visits DESC
      LIMIT 10
    `;

    const topPagesResult = await db.query(topPagesQuery, [
      websiteId,
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD 23:59:59')
    ]);

    // 获取流量来源
    const referrersQuery = `
      SELECT 
        CASE 
          WHEN referrer = '' OR referrer IS NULL THEN 'Direct'
          WHEN referrer LIKE '%google%' THEN 'Google'
          WHEN referrer LIKE '%facebook%' THEN 'Facebook'
          WHEN referrer LIKE '%twitter%' THEN 'Twitter'
          ELSE 'Other'
        END as source,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      GROUP BY source
      ORDER BY visits DESC
    `;

    const referrersResult = await db.query(referrersQuery, [
      websiteId,
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD 23:59:59')
    ]);

    res.json({
      overview: {
        totalVisits: parseInt(stats.total_visits) || 0,
        uniqueVisitors: parseInt(stats.unique_visitors) || 0,
        totalSessions: parseInt(stats.total_sessions) || 0,
        newVisitors: parseInt(stats.new_visitors) || 0,
        avgDuration: parseFloat(stats.avg_duration) || 0,
        bounceRate: parseFloat(bounceRate)
      },
      topPages: topPagesResult.rows,
      trafficSources: referrersResult.rows,
      dateRange: {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取时间序列数据
router.get('/timeseries/:websiteId', auth, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { startDate, endDate, granularity = 'day' } = req.query;
    
    const db = getDB();
    
    const start = startDate ? moment(startDate) : moment().subtract(30, 'days');
    const end = endDate ? moment(endDate) : moment();

    let dateFormat, dateGroup;
    switch (granularity) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00:00';
        dateGroup = 'YYYY-MM-DD HH24';
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateGroup = 'YYYY-MM-DD';
        break;
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        dateGroup = 'YYYY-WW';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGroup = 'YYYY-MM';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        dateGroup = 'YYYY-MM-DD';
    }

    const timeseriesQuery = `
      SELECT 
        TO_CHAR(visit_time, $4) as period,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      GROUP BY TO_CHAR(visit_time, $5)
      ORDER BY period
    `;

    const result = await db.query(timeseriesQuery, [
      websiteId,
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD 23:59:59'),
      dateFormat,
      dateGroup
    ]);

    res.json({
      timeseries: result.rows,
      granularity,
      dateRange: {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Analytics timeseries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取地理位置统计
router.get('/geography/:websiteId', auth, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { startDate, endDate } = req.query;
    
    const db = getDB();
    
    const start = startDate ? moment(startDate) : moment().subtract(30, 'days');
    const end = endDate ? moment(endDate) : moment();

    const geoQuery = `
      SELECT 
        country,
        city,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      AND country IS NOT NULL
      GROUP BY country, city
      ORDER BY visits DESC
      LIMIT 50
    `;

    const result = await db.query(geoQuery, [
      websiteId,
      start.format('YYYY-MM-DD'),
      end.format('YYYY-MM-DD 23:59:59')
    ]);

    res.json({
      geography: result.rows,
      dateRange: {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Analytics geography error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 获取设备和浏览器统计
router.get('/technology/:websiteId', auth, async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { startDate, endDate } = req.query;
    
    const db = getDB();
    
    const start = startDate ? moment(startDate) : moment().subtract(30, 'days');
    const end = endDate ? moment(endDate) : moment();

    // 浏览器统计
    const browserQuery = `
      SELECT 
        browser,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      AND browser IS NOT NULL
      GROUP BY browser
      ORDER BY visits DESC
      LIMIT 10
    `;

    // 操作系统统计
    const osQuery = `
      SELECT 
        os,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      AND os IS NOT NULL
      GROUP BY os
      ORDER BY visits DESC
      LIMIT 10
    `;

    // 设备统计
    const deviceQuery = `
      SELECT 
        device,
        COUNT(*) as visits,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM visits 
      WHERE website_id = $1 
      AND visit_time BETWEEN $2 AND $3
      AND device IS NOT NULL
      GROUP BY device
      ORDER BY visits DESC
      LIMIT 10
    `;

    const [browserResult, osResult, deviceResult] = await Promise.all([
      db.query(browserQuery, [websiteId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD 23:59:59')]),
      db.query(osQuery, [websiteId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD 23:59:59')]),
      db.query(deviceQuery, [websiteId, start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD 23:59:59')])
    ]);

    res.json({
      browsers: browserResult.rows,
      operatingSystems: osResult.rows,
      devices: deviceResult.rows,
      dateRange: {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD')
      }
    });

  } catch (error) {
    console.error('Analytics technology error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
