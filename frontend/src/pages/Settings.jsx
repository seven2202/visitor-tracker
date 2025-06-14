import React, { useState } from 'react'
import styled from 'styled-components'
import { FiUser, FiLock, FiSave } from 'react-icons/fi'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../utils/api'
import toast from 'react-hot-toast'

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Header = styled.div`
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
`

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const SettingsCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h2 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 24px 0;
    
    svg {
      font-size: 20px;
      color: #3498db;
    }
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
  }
  
  input {
    padding: 12px;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
    
    &:focus {
      outline: none;
      border-color: #3498db;
    }
    
    &:disabled {
      background: #f8f9fa;
      color: #6c757d;
    }
  }
`

const Button = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  
  &:hover {
    background: #2980b9;
  }
  
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 16px;
  }
`

const InfoCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 12px 0;
  }
  
  p {
    font-size: 14px;
    color: #7f8c8d;
    margin: 0;
    line-height: 1.5;
  }
`

function Settings() {
  const { user } = useAuthStore()
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('新密码和确认密码不匹配')
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('新密码长度至少为6位')
      return
    }

    setLoading(true)
    
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      
      toast.success('密码修改成功')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.error || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SettingsContainer>
      <Header>
        <h1>系统设置</h1>
      </Header>

      <SettingsGrid>
        <SettingsCard>
          <h2>
            <FiUser />
            用户信息
          </h2>
          
          <Form>
            <FormGroup>
              <label>用户名</label>
              <input 
                type="text" 
                value={user?.username || ''} 
                disabled 
              />
            </FormGroup>
            
            <FormGroup>
              <label>邮箱</label>
              <input 
                type="email" 
                value={user?.email || ''} 
                disabled 
              />
            </FormGroup>
            
            <FormGroup>
              <label>角色</label>
              <input 
                type="text" 
                value={user?.role === 'admin' ? '管理员' : '用户'} 
                disabled 
              />
            </FormGroup>
          </Form>
          
          <InfoCard>
            <h3>账户信息</h3>
            <p>
              用户名和邮箱暂时无法修改。如需修改，请联系系统管理员。
            </p>
          </InfoCard>
        </SettingsCard>

        <SettingsCard>
          <h2>
            <FiLock />
            修改密码
          </h2>
          
          <Form onSubmit={handlePasswordChange}>
            <FormGroup>
              <label>当前密码</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value
                })}
                placeholder="请输入当前密码"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <label>新密码</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value
                })}
                placeholder="请输入新密码（至少6位）"
                required
                minLength={6}
              />
            </FormGroup>
            
            <FormGroup>
              <label>确认新密码</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value
                })}
                placeholder="请再次输入新密码"
                required
              />
            </FormGroup>
            
            <Button type="submit" disabled={loading}>
              <FiSave />
              {loading ? '保存中...' : '保存密码'}
            </Button>
          </Form>
          
          <InfoCard>
            <h3>密码安全</h3>
            <p>
              为了账户安全，建议使用包含字母、数字和特殊字符的强密码，
              并定期更换密码。
            </p>
          </InfoCard>
        </SettingsCard>
      </SettingsGrid>
    </SettingsContainer>
  )
}

export default Settings
