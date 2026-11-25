import { CheckCircleOutlined, HeartOutlined, SwapOutlined, TrophyOutlined } from '@ant-design/icons'
import { Alert, Card, Col, Empty, Row, Statistic, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect } from 'react'
import { useUserStore } from '@/stores/userStore'
import type { FeedbackRecord } from '@/types/result'
import { FEEDBACK_TEXT } from '@/utils/format'

const TYPE_COLOR: Record<string, string> = {
  accept: 'success',
  override: 'geekblue',
  manual_select: 'purple'
}

export default function Preferences() {
  const { preferences, loading, error, loadPreferences } = useUserStore()

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  const columns: ColumnsType<FeedbackRecord> = [
    {
      title: '任务',
      dataIndex: 'task_name',
      render: (value: string, record) => (
        <div>
          <div style={{ fontSize: 13 }}>{value}</div>
          <div className="muted mono" style={{ fontSize: 11.5 }}>
            {record.task_id}
          </div>
        </div>
      )
    },
    { title: '系统推荐', dataIndex: 'recommended_id', width: 130 },
    { title: '最终选择', dataIndex: 'selected_id', width: 130 },
    {
      title: '反馈类型',
      dataIndex: 'feedback_type',
      width: 120,
      render: (value: FeedbackRecord['feedback_type']) => (
        <Tag color={TYPE_COLOR[value]}>{FEEDBACK_TEXT[value]}</Tag>
      )
    },
    {
      title: '反馈原因',
      dataIndex: 'reason',
      width: 150,
      render: (value?: string) => value ?? <span className="muted">—</span>
    },
    { title: '时间', dataIndex: 'created_at', width: 170 }
  ]

  const stats = preferences ?? {
    sample_count: 0,
    accept_count: 0,
    override_count: 0,
    manual_select_count: 0,
    records: []
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">我的偏好</h1>
        <p className="page-sub">系统从你的历史反馈中积累的偏好样本，用于个性化选片</p>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type="warning"
        showIcon
        message="偏好结论需由后端计算"
        description="页面只展示真实的反馈记录与样本数量。偏好模型给出的倾向性结论（如「更偏好高饱和色彩」）需要后端统计支持，当前不展示推测结果。"
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="偏好样本数"
              value={stats.sample_count}
              prefix={<HeartOutlined />}
              valueStyle={{ fontSize: 24 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="接受推荐"
              value={stats.accept_count}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ fontSize: 24, color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="更换推荐"
              value={stats.override_count}
              prefix={<SwapOutlined />}
              valueStyle={{ fontSize: 24, color: '#2563eb' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="手动指定"
              value={stats.manual_select_count}
              prefix={<TrophyOutlined />}
              valueStyle={{ fontSize: 24, color: '#7c3aed' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="反馈记录"
        extra={<span className="muted" style={{ fontSize: 12 }}>GET /api/preferences</span>}
      >
        <Table
          rowKey="id"
          loading={loading}
          dataSource={stats.records}
          columns={columns}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description={error ?? '暂无反馈记录'} /> }}
        />
      </Card>
    </div>
  )
}
