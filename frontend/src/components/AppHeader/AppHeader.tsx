import { BellOutlined, QuestionCircleOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Badge, Divider, Dropdown, Tag, Tooltip } from 'antd'
import { useNavigate } from 'react-router-dom'
import { USE_MOCK } from '@/services/request'

interface Props {
  title: string
}

export default function AppHeader({ title }: Props) {
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <div className="app-header-left">
        <h2 className="app-header-title">{title}</h2>
        <span className="app-header-desc">智能选片系统 · 课程项目演示版</span>
      </div>

      <div className="app-header-right">
        {USE_MOCK ? (
          <Tooltip title="当前展示的是前端内置演示数据，未接入算法模型（VITE_USE_MOCK=true）">
            <Tag color="warning" style={{ marginInlineEnd: 0 }}>
              演示数据
            </Tag>
          </Tooltip>
        ) : (
          <Tag color="success" style={{ marginInlineEnd: 0 }}>
            已接入后端
          </Tag>
        )}

        <Tooltip title="算法服务状态（演示环境未连接）">
          <span className="app-header-status">
            <Badge status={USE_MOCK ? 'default' : 'success'} />
            {USE_MOCK ? '离线演示' : '服务正常'}
          </span>
        </Tooltip>

        <Divider type="vertical" />

        <Tooltip title="使用说明">
          <QuestionCircleOutlined className="app-header-icon" />
        </Tooltip>
        <Tooltip title="通知">
          <BellOutlined className="app-header-icon" />
        </Tooltip>
        <Tooltip title="系统设置">
          <SettingOutlined className="app-header-icon" onClick={() => navigate('/settings')} />
        </Tooltip>

        <Dropdown
          menu={{
            items: [
              { key: 'profile', label: '演示用户（未接入登录）', disabled: true },
              { type: 'divider' },
              { key: 'preferences', label: '我的偏好', onClick: () => navigate('/preferences') },
              { key: 'history', label: '历史任务', onClick: () => navigate('/history') }
            ]
          }}
        >
          <div className="app-header-user">
            <Avatar size={26} icon={<UserOutlined />} />
            <span>演示用户</span>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
