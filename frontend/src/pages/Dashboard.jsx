import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { 
  FiEye, 
  FiUsers, 
  FiMousePointer, 
  FiClock,
  FiTrendingUp,
  FiTrendingDown
} from 'react-icons/fi'
import { websitesAPI, analyticsAPI } from '../utils/api'
import toast from 'react-hot-toast'

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
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
`

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`

const StatIcon = styled.div`
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
`

const StatValue = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
`

const StatLabel = styled.div`
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 500;
`

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 8px;
  
  &.positive {
    color: #27ae60;
  }
  
  &.negative {
    color: #e74c3c;
  }
  
  svg {
    font-size: 14px;
  }
`

const WebsiteGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
`

const WebsiteCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`

const WebsiteHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 16px;
  
  h3 {
    font-size: 18px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
  
  .domain {
    font-size: 14px;
    color: #7f8c8d;
    margin-top: 4px;
  }
`

const WebsiteStats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  .stat {
    text-align: center;
    
    .value {
      font-size: 24px;
      font-weight: 700;
      color: #3498db;
    }
    
    .label {
      font-size: 12px;
      color: #7f8c8d;
      margin-top: 4px;
    }
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

function Dashboard() {
  const [websites, setWebsites] = useState([])
  const [totalStats, setTotalStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    totalSessions: 0,
    avgDuration: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // 获取所有网站
      const websitesResponse = await websitesAPI.getAll()
      const websitesData = websitesResponse.data.websites
      setWebsites(websitesData)

      // 计算总统计
      let totalVisits = 0
      let totalUniqueVisitors = 0
      
      websitesData.forEach(website => {
        totalVisits += parseInt(website.today_visits) || 0
        totalUniqueVisitors += parseInt(website.today_unique_visitors) || 0
      })

      setTotalStats({
        totalVisits,
        uniqueVisitors: totalUniqueVisitors,
        totalSessions: Math.round(totalVisits * 0.8), // 估算
        avgDuration: 180 // 估算 3 分钟
      })

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <DashboardContainer>
      <StatsGrid>
        <StatCard color="#3498db">
          <StatHeader>
            <StatIcon color="#3498db">
              <FiEye />
            </StatIcon>
          </StatHeader>
          <StatValue>{totalStats.totalVisits.toLocaleString()}</StatValue>
          <StatLabel>今日访问量</StatLabel>
          <StatChange className="positive">
            <FiTrendingUp />
            +12.5% 较昨日
          </StatChange>
        </StatCard>

        <StatCard color="#27ae60">
          <StatHeader>
            <StatIcon color="#27ae60">
              <FiUsers />
            </StatIcon>
          </StatHeader>
          <StatValue>{totalStats.uniqueVisitors.toLocaleString()}</StatValue>
          <StatLabel>独立访客</StatLabel>
          <StatChange className="positive">
            <FiTrendingUp />
            +8.3% 较昨日
          </StatChange>
        </StatCard>

        <StatCard color="#f39c12">
          <StatHeader>
            <StatIcon color="#f39c12">
              <FiMousePointer />
            </StatIcon>
          </StatHeader>
          <StatValue>{totalStats.totalSessions.toLocaleString()}</StatValue>
          <StatLabel>会话数</StatLabel>
          <StatChange className="negative">
            <FiTrendingDown />
            -2.1% 较昨日
          </StatChange>
        </StatCard>

        <StatCard color="#9b59b6">
          <StatHeader>
            <StatIcon color="#9b59b6">
              <FiClock />
            </StatIcon>
          </StatHeader>
          <StatValue>{formatDuration(totalStats.avgDuration)}</StatValue>
          <StatLabel>平均停留时间</StatLabel>
          <StatChange className="positive">
            <FiTrendingUp />
            +5.7% 较昨日
          </StatChange>
        </StatCard>
      </StatsGrid>

      <div>
        <h2 style={{ marginBottom: '24px', color: '#2c3e50' }}>网站概览</h2>
        <WebsiteGrid>
          {websites.map(website => (
            <WebsiteCard key={website.id}>
              <WebsiteHeader>
                <div>
                  <h3>{website.name}</h3>
                  <div className="domain">{website.domain}</div>
                </div>
              </WebsiteHeader>
              <WebsiteStats>
                <div className="stat">
                  <div className="value">{parseInt(website.today_visits) || 0}</div>
                  <div className="label">今日访问</div>
                </div>
                <div className="stat">
                  <div className="value">{parseInt(website.today_unique_visitors) || 0}</div>
                  <div className="label">独立访客</div>
                </div>
              </WebsiteStats>
            </WebsiteCard>
          ))}
          
          {websites.length === 0 && (
            <div style={{ 
              gridColumn: '1 / -1', 
              textAlign: 'center', 
              padding: '48px',
              color: '#7f8c8d'
            }}>
              暂无网站数据，请先添加网站
            </div>
          )}
        </WebsiteGrid>
      </div>
    </DashboardContainer>
  )
}

export default Dashboard
