import { lazy, Suspense, type ReactNode } from 'react'
import { createHashRouter, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import MainLayout from '@/layouts/MainLayout'

/**
 * 路由表（对应设计文档 2.2）。
 * 使用 hash 路由，打包后可直接以静态文件方式打开或部署到任意子路径；
 * 若后端支持 history fallback，改成 createBrowserRouter 即可。
 * 页面按需加载，避免首屏加载全部页面与图表库。
 */
const Upload = lazy(() => import('@/pages/Upload'))
const Processing = lazy(() => import('@/pages/Processing'))
const Result = lazy(() => import('@/pages/Result'))
const CandidateDetail = lazy(() => import('@/pages/CandidateDetail'))
const History = lazy(() => import('@/pages/History'))
const Preferences = lazy(() => import('@/pages/Preferences'))
const Evaluation = lazy(() => import('@/pages/Evaluation'))
const Settings = lazy(() => import('@/pages/Settings'))

const withSuspense = (node: ReactNode) => (
  <Suspense
    fallback={
      <div style={{ display: 'grid', placeItems: 'center', padding: '80px 0', gap: 12 }}>
        <Spin size="large" />
        <span style={{ fontSize: 12.5, color: '#8a919c' }}>页面加载中…</span>
      </div>
    }
  >
    {node}
  </Suspense>
)

const router = createHashRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(<Upload />) },
      { path: 'task/:taskId', element: withSuspense(<Processing />) },
      { path: 'result/:taskId', element: withSuspense(<Result />) },
      { path: 'candidate/:taskId/:candidateId', element: withSuspense(<CandidateDetail />) },
      { path: 'history', element: withSuspense(<History />) },
      { path: 'preferences', element: withSuspense(<Preferences />) },
      { path: 'evaluation', element: withSuspense(<Evaluation />) },
      { path: 'settings', element: withSuspense(<Settings />) },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
])

export default router
