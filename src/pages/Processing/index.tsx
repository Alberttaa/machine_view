import { ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Descriptions, Empty, Row, Space, Tag } from 'antd'
import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ProcessStepper from '@/components/ProcessStepper'
import ProgressPanel from '@/components/ProgressPanel'
import { useTaskStore } from '@/stores/taskStore'

const POLL_INTERVAL = 800

export default function Processing() {
  const { taskId: paramTaskId } = useParams()
  const navigate = useNavigate()
  const taskId = useTaskStore((s) => s.taskId)
  const status = useTaskStore((s) => s.status)
  const params = useTaskStore((s) => s.params)
  const setTaskId = useTaskStore((s) => s.setTaskId)
  const fetchStatus = useTaskStore((s) => s.fetchStatus)
  const fetchResult = useTaskStore((s) => s.fetchResult)
  const timerRef = useRef<number>()

  useEffect(() => {
    if (paramTaskId) setTaskId(paramTaskId)
  }, [paramTaskId, setTaskId])

  useEffect(() => {
    if (!taskId) return
    let cancelled = false

    const tick = async () => {
      const next = await fetchStatus()
      if (cancelled || !next) return

      if (next.status === 'completed') {
        await fetchResult()
        if (!cancelled) navigate(`/result/${taskId}`, { replace: true })
        return
      }
      if (next.status === 'all_poor' || next.status === 'failed') return

      timerRef.current = window.setTimeout(tick, POLL_INTERVAL)
    }

    tick()
    return () => {
      cancelled = true
      window.clearTimeout(timerRef.current)
    }
  }, [taskId, fetchStatus, fetchResult, navigate])

  if (!taskId) {
    return (
      <div className="page">
        <Card>
          <Empty description="未找到任务，请先上传照片创建选片任务">
            <Button type="primary" onClick={() => navigate('/')}>
              去上传照片
            </Button>
          </Empty>
        </Card>
      </div>
    )
  }

  const isAllPoor = status?.status === 'all_poor'
  const isFailed = status?.status === 'failed'

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">任务处理</h1>
        <p className="page-sub">
          系统正在按「候选生成 → 预处理 → 质量筛查 → 美学评分 → 置信度评估 → 偏好比较 → 结果解释」执行
        </p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <ProgressPanel status={status} />
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="处理阶段">
            <ProcessStepper
              status={status?.status}
              preferenceTriggered={status?.preference_triggered ?? false}
              enableCrop={params.enable_crop}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="任务信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="任务编号">{taskId}</Descriptions.Item>
              <Descriptions.Item label="场景类型">
                {params.scene_type === 'auto' ? '自动识别' : params.scene_type}
              </Descriptions.Item>
              <Descriptions.Item label="智能裁剪">
                {params.enable_crop ? <Tag color="blue">已启用</Tag> : <Tag>未启用</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="个性化偏好">
                {params.enable_preference ? <Tag color="blue">已启用</Tag> : <Tag>未启用</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="照片数量">
                {status ? `${status.total_count} 张` : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {status?.status === 'completed' && (
            <Alert
              type="success"
              showIcon
              message="处理完成"
              description="正在跳转到选片结果页…"
              action={
                <Button size="small" onClick={() => navigate(`/result/${taskId}`)}>
                  立即查看
                </Button>
              }
            />
          )}

          {isAllPoor && (
            <Card title="下一步">
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                本组照片未产出可用结果，可更换照片重新选片。
              </div>
              <Space>
                <Button type="primary" icon={<ReloadOutlined />} onClick={() => navigate('/')}>
                  重新上传照片
                </Button>
                <Button onClick={() => navigate('/history')}>查看历史任务</Button>
              </Space>
            </Card>
          )}

          {isFailed && (
            <Card title="下一步">
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                可重新创建任务；若连续失败，请检查算法服务状态。
              </div>
              <Space>
                <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate('/')}>
                  返回重新创建任务
                </Button>
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}
