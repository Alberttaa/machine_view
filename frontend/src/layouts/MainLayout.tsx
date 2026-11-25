import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import AppHeader from '@/components/AppHeader'
import AppSidebar from '@/components/AppSidebar'

const PAGE_TITLES: Record<string, string> = {
  '/': '开始选片',
  '/history': '历史任务',
  '/preferences': '我的偏好',
  '/evaluation': '模型评估',
  '/settings': '系统设置'
}

function resolveTitle(pathname: string): string {
  if (pathname.startsWith('/task')) return '任务处理'
  if (pathname.startsWith('/result')) return '选片结果'
  if (pathname.startsWith('/candidate')) return '候选照片详情'
  return PAGE_TITLES[pathname] ?? '智能选片工作台'
}

export default function MainLayout() {
  const { pathname } = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider width={216} theme="light" className="app-sider">
        <AppSidebar />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="app-header-wrap">
          <AppHeader title={resolveTitle(pathname)} />
        </Layout.Header>
        <Layout.Content className="app-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
