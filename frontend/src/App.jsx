import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import styled from 'styled-components'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Websites from './pages/Websites'
import Settings from './pages/Settings'
import Login from './pages/Login'
import { useAuthStore } from './stores/authStore'

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
`

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const ContentArea = styled.main`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
`

function App() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <AppContainer>
      <Sidebar />
      <MainContent>
        <Header />
        <ContentArea>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/websites" element={<Websites />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ContentArea>
      </MainContent>
    </AppContainer>
  )
}

export default App
