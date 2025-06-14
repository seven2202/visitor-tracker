import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { FiPlus, FiEdit, FiTrash2, FiCopy, FiRefreshCw } from 'react-icons/fi'
import { websitesAPI } from '../utils/api'
import toast from 'react-hot-toast'

const WebsitesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`

const Header = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }
`

const AddButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: #2980b9;
  }
  
  svg {
    font-size: 16px;
  }
`

const WebsitesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const WebsiteCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
`

const WebsiteHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`

const WebsiteInfo = styled.div`
  flex: 1;
  
  h3 {
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0 0 8px 0;
  }
  
  .domain {
    font-size: 14px;
    color: #7f8c8d;
    margin-bottom: 8px;
  }
  
  .created {
    font-size: 12px;
    color: #95a5a6;
  }
`

const WebsiteActions = styled.div`
  display: flex;
  gap: 8px;
`

const ActionButton = styled.button`
  background: ${props => props.variant === 'danger' ? '#e74c3c' : '#95a5a6'};
  color: white;
  border: none;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: ${props => props.variant === 'danger' ? '#c0392b' : '#7f8c8d'};
  }
  
  svg {
    font-size: 14px;
  }
`

const ApiKeySection = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
  
  .label {
    font-size: 12px;
    font-weight: 600;
    color: #7f8c8d;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  
  .key-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .key {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 14px;
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 4px;
    padding: 8px 12px;
    flex: 1;
    color: #2c3e50;
  }
`

const CopyButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
  
  &:hover {
    background: #2980b9;
  }
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-top: 16px;
  
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 500px;
  
  h2 {
    margin: 0 0 24px 0;
    color: #2c3e50;
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
  }
  
  input {
    padding: 12px;
    border: 1px solid #e1e5e9;
    border-radius: 6px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #3498db;
    }
  }
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`

const Button = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  
  &.primary {
    background: #3498db;
    color: white;
    
    &:hover {
      background: #2980b9;
    }
  }
  
  &.secondary {
    background: #95a5a6;
    color: white;
    
    &:hover {
      background: #7f8c8d;
    }
  }
`

function Websites() {
  const [websites, setWebsites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ name: '', domain: '' })

  useEffect(() => {
    fetchWebsites()
  }, [])

  const fetchWebsites = async () => {
    try {
      setLoading(true)
      const response = await websitesAPI.getAll()
      setWebsites(response.data.websites)
    } catch (error) {
      toast.error('获取网站列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      await websitesAPI.create(formData)
      toast.success('网站添加成功')
      setShowModal(false)
      setFormData({ name: '', domain: '' })
      fetchWebsites()
    } catch (error) {
      toast.error('添加网站失败')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个网站吗？')) return
    
    try {
      await websitesAPI.delete(id)
      toast.success('网站删除成功')
      fetchWebsites()
    } catch (error) {
      toast.error('删除网站失败')
    }
  }

  const handleRegenerateKey = async (id) => {
    if (!confirm('确定要重新生成 API Key 吗？旧的 Key 将失效。')) return
    
    try {
      await websitesAPI.regenerateKey(id)
      toast.success('API Key 重新生成成功')
      fetchWebsites()
    } catch (error) {
      toast.error('重新生成 API Key 失败')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  if (loading) {
    return <div>加载中...</div>
  }

  return (
    <WebsitesContainer>
      <Header>
        <h1>网站管理</h1>
        <AddButton onClick={() => setShowModal(true)}>
          <FiPlus />
          添加网站
        </AddButton>
      </Header>

      <WebsitesList>
        {websites.map(website => (
          <WebsiteCard key={website.id}>
            <WebsiteHeader>
              <WebsiteInfo>
                <h3>{website.name}</h3>
                <div className="domain">{website.domain}</div>
                <div className="created">创建于 {formatDate(website.created_at)}</div>
              </WebsiteInfo>
              <WebsiteActions>
                <ActionButton onClick={() => handleRegenerateKey(website.id)}>
                  <FiRefreshCw />
                </ActionButton>
                <ActionButton variant="danger" onClick={() => handleDelete(website.id)}>
                  <FiTrash2 />
                </ActionButton>
              </WebsiteActions>
            </WebsiteHeader>

            <ApiKeySection>
              <div className="label">API Key</div>
              <div className="key-container">
                <input 
                  className="key" 
                  value={website.api_key} 
                  readOnly 
                />
                <CopyButton onClick={() => copyToClipboard(website.api_key)}>
                  <FiCopy />
                </CopyButton>
              </div>
            </ApiKeySection>

            <StatsGrid>
              <div className="stat">
                <div className="value">{website.today_visits || 0}</div>
                <div className="label">今日访问</div>
              </div>
              <div className="stat">
                <div className="value">{website.today_unique_visitors || 0}</div>
                <div className="label">独立访客</div>
              </div>
            </StatsGrid>
          </WebsiteCard>
        ))}
      </WebsitesList>

      {showModal && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>添加新网站</h2>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <label>网站名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="例如：我的博客"
                  required
                />
              </FormGroup>
              <FormGroup>
                <label>域名</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={e => setFormData({...formData, domain: e.target.value})}
                  placeholder="例如：example.com"
                  required
                />
              </FormGroup>
              <ButtonGroup>
                <Button type="button" className="secondary" onClick={() => setShowModal(false)}>
                  取消
                </Button>
                <Button type="submit" className="primary">
                  添加
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </WebsitesContainer>
  )
}

export default Websites
