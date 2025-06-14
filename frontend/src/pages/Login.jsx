import React, { useState } from 'react'
import styled from 'styled-components'
import toast from 'react-hot-toast'
import { useAuthStore } from '../stores/authStore'
import { authAPI } from '../utils/api'

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`

const LoginCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
`

const Logo = styled.div`
  text-align: center;
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
  }
  
  p {
    color: #666;
    font-size: 14px;
  }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  font-weight: 500;
  color: #333;
  font-size: 14px;
`

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &::placeholder {
    color: #999;
  }
`

const Button = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  margin-top: 16px;
`

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuthStore()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError('请填写用户名和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login(formData)
      const { token, user } = response.data

      login(user, token)
      toast.success('登录成功！')
    } catch (error) {
      console.error('Login error:', error)
      setError(error.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginContainer>
      <LoginCard>
        <Logo>
          <h1>Visit Tracker</h1>
          <p>网站访问统计管理系统</p>
        </Logo>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="username">用户名</Label>
            <Input
              type="text"
              id="username"
              name="username"
              placeholder="请输入用户名"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="password">密码</Label>
            <Input
              type="password"
              id="password"
              name="password"
              placeholder="请输入密码"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </FormGroup>

          <Button type="submit" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
      </LoginCard>
    </LoginContainer>
  )
}

export default Login
