import {
  BarChartOutlined,
  HeartOutlined,
  HistoryOutlined,
  PlusCircleOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { Menu } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'

const items = [
  {
    type: 'group' as const,
    label: '核心流程',
    children: [{ key: '/', icon: <PlusCircleOutlined />, label: '开始选片' }]
  },
  {
    type: 'group' as const,
    label: '记录与偏好',
    children: [
      { key: '/history', icon: <HistoryOutlined />, label: '历史任务' },
      { key: '/preferences', icon: <HeartOutlined />, label: '我的偏好' }
    ]
  },
  {
    type: 'group' as const,
    label: '系统',
    children: [
      { key: '/evaluation', icon: <BarChartOutlined />, label: '模型评估' },
      { key: '/settings', icon: <SettingOutlined />, label: '系统设置' }
    ]
  }
]

export default function AppSidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  // 处理中 / 结果页归属于「开始选片」这条链路
  const path = location.pathname
  const selectedKey =
    path === '/' || path.startsWith('/task') || path.startsWith('/result') || path.startsWith('/candidate')
      ? '/'
      : path

  return (
    <div className="app-sidebar">
      <div className="app-brand">
        <span className="app-brand-mark">SPS</span>
        <div className="app-brand-text">
          <div className="app-brand-name">智能选片工作台</div>
          <div className="app-brand-sub">Smart Photo Selector</div>
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ borderInlineEnd: 'none', flex: 1 }}
      />

      <div className="app-sidebar-foot">
        <div className="app-sidebar-foot-title">当前阶段</div>
        <div className="app-sidebar-foot-text">
          P0 基础选片流程 · P1 偏好与历史 · P2 评估与设置
        </div>
      </div>
    </div>
  )
}
