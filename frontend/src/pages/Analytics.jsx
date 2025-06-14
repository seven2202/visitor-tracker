import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { websitesAPI, analyticsAPI } from '../utils/api'
import {
  FiTrendingUp,
  FiUsers,
  FiEye,
  FiClock,
  FiGlobe,
  FiMonitor,
  FiSmartphone
} from 'react-icons/fi'
import toast from 'react-hot-toast'

const AnalyticsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
`

const WebsiteSelector = styled.select`
  padding: 8px 16px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 200px;
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
`

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${props => props.color || '#3498db'};

  .stat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: ${props => props.color || '#3498db'}20;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.color || '#3498db'};

    svg {
      font-size: 24px;
    }
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    color: #7f8c8d;
    font-weight: 500;
  }
`

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const ChartCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 20px 0;
  }
`

const TableCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 20px 0;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: 12px 8px;
    text-align: left;
    border-bottom: 1px solid #e1e5e9;
  }

  th {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
  }

  td {
    font-size: 14px;
    color: #333;
  }

  tr:hover {
    background: #f8f9fa;
  }
`

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;

  &::after {
    content: '';
    width: 32px;
    height: 32px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: 48px;
  color: #7f8c8d;

  h3 {
    margin-bottom: 8px;
    color: #2c3e50;
  }
`

function Analytics() {
  const [websites, setWebsites] = useState([])
  const [selectedWebsite, setSelectedWebsite] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWebsites()
  }, [])

  useEffect(() => {
    if (selectedWebsite) {
      fetchAnalytics()
    }
  }, [selectedWebsite])

  const fetchWebsites = async () => {
    try {
      const response = await websitesAPI.getAll()
      const websitesData = response.data.websites
      setWebsites(websitesData)
      if (websitesData.length > 0) {
        setSelectedWebsite(websitesData[0].id.toString())
      }
    } catch (error) {
      toast.error('获取网站列表失败')
    }
  }

  const fetchAnalytics = async () => {
    if (!selectedWebsite) return

    setLoading(true)
    try {
      const [overviewResponse, technologyResponse] = await Promise.all([
        analyticsAPI.getOverview(selectedWebsite),
        analyticsAPI.getTechnology(selectedWebsite)
      ])

      setAnalytics({
        overview: overviewResponse.data.overview,
        topPages: overviewResponse.data.topPages,
        trafficSources: overviewResponse.data.trafficSources,
        technology: technologyResponse.data
      })
    } catch (error) {
      toast.error('获取分析数据失败')
      console.error('Analytics error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (websites.length === 0) {
    return (
      <AnalyticsContainer>
        <Header>
          <h1>数据分析</h1>
        </Header>
        <EmptyState>
          <h3>暂无网站数据</h3>
          <p>请先在网站管理中添加网站</p>
        </EmptyState>
      </AnalyticsContainer>
    )
  }

  return (
    <AnalyticsContainer>
      <Header>
        <h1>数据分析</h1>
        <WebsiteSelector
          value={selectedWebsite}
          onChange={(e) => setSelectedWebsite(e.target.value)}
        >
          {websites.map(website => (
            <option key={website.id} value={website.id}>
              {website.name} ({website.domain})
            </option>
          ))}
        </WebsiteSelector>
      </Header>

      {loading ? (
        <LoadingSpinner />
      ) : analytics ? (
        <>
          <StatsGrid>
            <StatCard color="#3498db">
              <div className="stat-header">
                <div className="stat-icon">
                  <FiEye />
                </div>
              </div>
              <div className="stat-value">{analytics.overview.totalVisits.toLocaleString()}</div>
              <div className="stat-label">总访问量</div>
            </StatCard>

            <StatCard color="#27ae60">
              <div className="stat-header">
                <div className="stat-icon">
                  <FiUsers />
                </div>
              </div>
              <div className="stat-value">{analytics.overview.uniqueVisitors.toLocaleString()}</div>
              <div className="stat-label">独立访客</div>
            </StatCard>

            <StatCard color="#f39c12">
              <div className="stat-header">
                <div className="stat-icon">
                  <FiClock />
                </div>
              </div>
              <div className="stat-value">{Math.round(analytics.overview.avgDuration)}s</div>
              <div className="stat-label">平均停留时间</div>
            </StatCard>

            <StatCard color="#e74c3c">
              <div className="stat-header">
                <div className="stat-icon">
                  <FiTrendingUp />
                </div>
              </div>
              <div className="stat-value">{analytics.overview.bounceRate}%</div>
              <div className="stat-label">跳出率</div>
            </StatCard>
          </StatsGrid>

          <AnalyticsGrid>
            <div>
              <TableCard>
                <h3>热门页面</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>页面</th>
                      <th>访问量</th>
                      <th>独立访客</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topPages.map((page, index) => (
                      <tr key={index}>
                        <td title={page.page_url}>
                          {page.page_title || page.page_url.substring(0, 50)}
                          {page.page_url.length > 50 && '...'}
                        </td>
                        <td>{page.visits}</td>
                        <td>{page.unique_visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>

              <TableCard style={{ marginTop: '24px' }}>
                <h3>流量来源</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>来源</th>
                      <th>访问量</th>
                      <th>独立访客</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.trafficSources.map((source, index) => (
                      <tr key={index}>
                        <td>{source.source}</td>
                        <td>{source.visits}</td>
                        <td>{source.unique_visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>
            </div>

            <div>
              <TableCard>
                <h3>浏览器统计</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>浏览器</th>
                      <th>访问量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.technology.browsers.map((browser, index) => (
                      <tr key={index}>
                        <td>{browser.browser}</td>
                        <td>{browser.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>

              <TableCard style={{ marginTop: '24px' }}>
                <h3>操作系统</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>系统</th>
                      <th>访问量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.technology.operatingSystems.map((os, index) => (
                      <tr key={index}>
                        <td>{os.os}</td>
                        <td>{os.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>

              <TableCard style={{ marginTop: '24px' }}>
                <h3>设备类型</h3>
                <Table>
                  <thead>
                    <tr>
                      <th>设备</th>
                      <th>访问量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.technology.devices.map((device, index) => (
                      <tr key={index}>
                        <td>{device.device}</td>
                        <td>{device.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </TableCard>
            </div>
          </AnalyticsGrid>
        </>
      ) : (
        <EmptyState>
          <h3>选择网站查看分析数据</h3>
        </EmptyState>
      )}
    </AnalyticsContainer>
  )
}

export default Analytics
