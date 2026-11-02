import { DeleteOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Empty, Popconfirm, Space, Table, Tag, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '@/stores/userStore'
import type { HistoryItem } from '@/types/result'
import { FEEDBACK_TEXT } from '@/utils/format'

const STATUS_MAP: Record<HistoryItem['status'], { text: string; color: string }> = {
  completed: { text: '已完成', color: 'success' },
  processing: { text: '处理中', color: 'processing' },
  failed: { text: '失败', color: 'error' },
  all_poor: { text: '质量均不理想', color: 'warning' }
}

export default function History() {
  const navigate = useNavigate()
  const { history, loading, error, loadHistory } = useUserStore()
  const { message } = App.useApp()

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  const columns: ColumnsType<HistoryItem> = [
    {
      title: '任务',
      dataIndex: 'task_name',
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 64,
              height: 42,
              borderRadius: 6,
              overflow: 'hidden',
              background: '#eef0f3',
              flex: '0 0 auto',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            {record.cover_url ? (
              <img
                src={record.cover_url}
                alt={record.task_name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span className="muted" style={{ fontSize: 11 }}>
                无结果
              </span>
            )}
          </div>
          <div>
            <div style={{ fontSize: 13 }}>{record.task_name}</div>
            <div className="muted mono" style={{ fontSize: 11.5 }}>
              {record.task_id}
            </div>
          </div>
        </div>
      )
    },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '照片数量',
      dataIndex: 'photo_count',
      width: 96,
      render: (value: number) => `${value} 张`
    },
    {
      title: '任务状态',
      dataIndex: 'status',
      width: 130,
      render: (value: HistoryItem['status']) => (
        <Tag color={STATUS_MAP[value].color}>{STATUS_MAP[value].text}</Tag>
      )
    },
    {
      title: '我的反馈',
      dataIndex: 'feedback_type',
      width: 110,
      render: (value: HistoryItem['feedback_type']) =>
        value ? <Tag>{FEEDBACK_TEXT[value]}</Tag> : <span className="muted">—</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 210,
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            type="link"
            icon={<EyeOutlined />}
            disabled={!record.best_candidate_id}
            onClick={() => navigate(`/result/${record.task_id}`)}
          >
            查看结果
          </Button>
          <Tooltip title="需要后端支持重新入队">
            <Button size="small" type="link" icon={<ReloadOutlined />} disabled>
              重跑
            </Button>
          </Tooltip>
          <Popconfirm
            title="删除历史任务"
            description="该操作需要后端支持，当前演示环境未开放。"
            okText="知道了"
            cancelText="取消"
            onConfirm={() => message.info('演示环境未开放删除接口')}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">历史任务</h1>
        <p className="page-sub">查看过去的选片任务及其结果（数据来自 /api/history）</p>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="历史任务属于 P1 功能"
        description="当前列表为演示数据。接入后端后由 GET /api/history 返回，删除与重新执行需要后端提供对应接口。"
      />

      <Card>
        <Table
          rowKey="task_id"
          loading={loading}
          dataSource={history}
          columns={columns}
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          locale={{ emptyText: <Empty description={error ?? '暂无历史任务'} /> }}
        />
      </Card>
    </div>
  )
}
