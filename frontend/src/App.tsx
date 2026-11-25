import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { RouterProvider } from 'react-router-dom'
import router from './router'

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#2563eb',
          colorSuccess: '#16a34a',
          colorWarning: '#d97706',
          colorError: '#dc2626',
          borderRadius: 8,
          colorText: '#1f2328',
          colorTextSecondary: '#5c6470',
          colorBgLayout: '#f5f6f8',
          fontSize: 14
        },
        components: {
          Layout: { siderBg: '#ffffff', headerBg: '#ffffff', bodyBg: '#f5f6f8' },
          Menu: { itemSelectedBg: '#eff4ff', itemSelectedColor: '#1d4ed8' },
          Card: { paddingLG: 20 }
        }
      }}
    >
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  )
}
