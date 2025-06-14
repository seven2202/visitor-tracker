import React from 'react'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'
import {
  FiHome,
  FiBarChart2,
  FiGlobe,
  FiSettings,
  FiActivity
} from 'react-icons/fi'

const SidebarContainer = styled.aside`
  width: 260px;
  background: #2c3e50;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
`

const Logo = styled.div`
  padding: 24px 20px;
  border-bottom: 1px solid #34495e;
  
  h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color: #ecf0f1;
  }
  
  p {
    font-size: 12px;
    color: #95a5a6;
    margin: 4px 0 0 0;
  }
`

const Navigation = styled.nav`
  flex: 1;
  padding: 20px 0;
`

const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #bdc3c7;
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
  
  &:hover {
    background: #34495e;
    color: #ecf0f1;
  }
  
  &.active {
    background: #34495e;
    color: #3498db;
    border-left-color: #3498db;
  }
  
  svg {
    font-size: 18px;
  }
  
  span {
    font-weight: 500;
  }
`

const Footer = styled.div`
  padding: 20px;
  border-top: 1px solid #34495e;
  font-size: 12px;
  color: #95a5a6;
  text-align: center;
`

function Sidebar() {
  return (
    <SidebarContainer>
      <Logo>
        <h2>Visit Tracker</h2>
        <p>数据统计分析</p>
      </Logo>

      <Navigation>
        <NavItem to="/dashboard">
          <FiHome />
          <span>仪表板</span>
        </NavItem>
        
        <NavItem to="/analytics">
          <FiBarChart2 />
          <span>数据分析</span>
        </NavItem>
        
        <NavItem to="/websites">
          <FiGlobe />
          <span>网站管理</span>
        </NavItem>
        
        <NavItem to="/settings">
          <FiSettings />
          <span>系统设置</span>
        </NavItem>
      </Navigation>

      <Footer>
        <div>
          <FiActivity style={{ marginRight: '4px' }} />
          Visit Tracker v1.0
        </div>
      </Footer>
    </SidebarContainer>
  )
}

export default Sidebar
