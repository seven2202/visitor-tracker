import React from 'react'
import styled from 'styled-components'
import { FiUser, FiLogOut, FiBell } from 'react-icons/fi'
import { useAuthStore } from '../stores/authStore'
import toast from 'react-hot-toast'

const HeaderContainer = styled.header`
  background: white;
  border-bottom: 1px solid #e1e5e9;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const NotificationButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    background: #f8f9fa;
    color: #333;
  }
  
  svg {
    font-size: 18px;
  }
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: #f8f9fa;
`

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  
  .username {
    font-weight: 600;
    color: #333;
    font-size: 14px;
  }
  
  .role {
    font-size: 12px;
    color: #666;
  }
`

const LogoutButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  
  &:hover {
    background: #fee;
    color: #e74c3c;
  }
  
  svg {
    font-size: 18px;
  }
`

function Header() {
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    toast.success('已安全退出')
  }

  const getPageTitle = () => {
    const path = window.location.pathname
    switch (path) {
      case '/dashboard':
        return '仪表板'
      case '/analytics':
        return '数据分析'
      case '/websites':
        return '网站管理'
      case '/settings':
        return '系统设置'
      default:
        return 'Visit Tracker'
    }
  }

  return (
    <HeaderContainer>
      <Title>{getPageTitle()}</Title>
      
      <UserSection>
        <NotificationButton>
          <FiBell />
        </NotificationButton>
        
        <UserInfo>
          <Avatar>
            {user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <UserDetails>
            <div className="username">{user?.username || 'Unknown'}</div>
            <div className="role">{user?.role === 'admin' ? '管理员' : '用户'}</div>
          </UserDetails>
        </UserInfo>
        
        <LogoutButton onClick={handleLogout} title="退出登录">
          <FiLogOut />
        </LogoutButton>
      </UserSection>
    </HeaderContainer>
  )
}

export default Header
