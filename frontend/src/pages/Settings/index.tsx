import { InfoCircleOutlined } from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip
} from 'antd'
import { USE_MOCK } from '@/services/request'

export default function Settings() {
  const [form] = Form.useForm()
  const { message } = App.useApp()

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">系统设置</h1>
        <p className="page-sub">P2 功能：当前仅保留基础设置入口，配置项尚未接入后端持久化</p>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="演示环境说明"
        description="设置项默认值与前端的本地校验规则一致；保存需要后端提供配置接口（当前未实现），因此「保存」按钮为禁用状态。"
      />

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="图片上传限制" style={{ marginBottom: 16 }}>
            <Form
              form={form}
              layout="horizontal"
              labelCol={{ span: 9 }}
              wrapperCol={{ span: 15 }}
              initialValues={{
                maxPhotos: 30,
                maxSizeMb: 20,
                defaultScene: 'auto',
                defaultCrop: true,
                defaultPreference: true
              }}
            >
              <Form.Item label="最多上传张数" name="maxPhotos">
                <InputNumber min={2} max={50} style={{ width: 120 }} disabled />
              </Form.Item>
              <Form.Item label="单张大小上限 (MB)" name="maxSizeMb">
                <InputNumber min={1} max={50} style={{ width: 120 }} disabled />
              </Form.Item>
              <Form.Item label="支持格式">
                <Space size={4}>
                  <Tag>JPG</Tag>
                  <Tag>JPEG</Tag>
                  <Tag>PNG</Tag>
                  <Tag>WebP</Tag>
                </Space>
              </Form.Item>

              <Divider style={{ margin: '8px 0 16px' }} />

              <Form.Item label="默认场景类型" name="defaultScene">
                <Select
                  style={{ width: 150 }}
                  disabled
                  options={[
                    { value: 'auto', label: '自动识别' },
                    { value: 'portrait', label: '人像' },
                    { value: 'landscape', label: '风景' },
                    { value: 'other', label: '其他' }
                  ]}
                />
              </Form.Item>
              <Form.Item label="默认启用智能裁剪" name="defaultCrop" valuePropName="checked">
                <Switch size="small" disabled />
              </Form.Item>
              <Form.Item label="默认启用个性化偏好" name="defaultPreference" valuePropName="checked">
                <Switch size="small" disabled />
              </Form.Item>

              <Form.Item wrapperCol={{ offset: 9, span: 15 }}>
                <Tooltip title="需要后端配置接口支持">
                  <Button type="primary" disabled>
                    保存设置
                  </Button>
                </Tooltip>
                <Button style={{ marginLeft: 8 }} onClick={() => message.info('已恢复为默认值')}>
                  恢复默认
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="系统信息">
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="系统名称">智能选片系统（Smart Photo Selector）</Descriptions.Item>
              <Descriptions.Item label="前端版本">v0.1.0 · 课程项目演示版</Descriptions.Item>
              <Descriptions.Item label="技术栈">
                React 18 + TypeScript + Vite + Ant Design + Zustand + ECharts
              </Descriptions.Item>
              <Descriptions.Item label="接口模式">
                {USE_MOCK ? (
                  <Tag color="warning">Mock 演示数据</Tag>
                ) : (
                  <Tag color="success">已接入后端</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="接口前缀">
                <span className="mono">{import.meta.env.VITE_API_BASE || '/api'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="用户体系">
                未接入（演示用户）
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <div className="muted" style={{ fontSize: 12, lineHeight: 1.9 }}>
              <InfoCircleOutlined style={{ marginRight: 6 }} />
              切换真实后端：复制 <code>.env.example</code> 为 <code>.env</code>，将
              <code> VITE_USE_MOCK</code> 设为 <code>false</code>，并确认后端已实现
              <code> /api/tasks</code> 等接口（见 docs/api-mapping.md）。
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
