import { Alert, Col, Progress, Row, Statistic, Tag } from 'antd'
import type { TaskStatusPayload } from '@/types/task'
import { TASK_STATUS_COLOR, TASK_STATUS_TEXT } from '@/utils/format'

interface Props {
  status: TaskStatusPayload | null
}

export default function ProgressPanel({ status }: Props) {
  if (!status) {
    return <Alert type="info" showIcon message="正在建立任务连接…" />
  }

  const running = !['completed', 'all_poor', 'failed'].includes(status.status)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <Progress
          type="circle"
          size={92}
          percent={status.progress}
          status={
            status.status === 'failed'
              ? 'exception'
              : status.status === 'all_poor'
                ? 'normal'
                : status.status === 'completed'
                  ? 'success'
                  : 'active'
          }
          strokeColor={status.status === 'all_poor' ? '#d97706' : undefined}
        />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Tag color={TASK_STATUS_COLOR[status.status]}>{TASK_STATUS_TEXT[status.status]}</Tag>
            {status.preference_triggered ? (
              <Tag color="geekblue">已触发偏好比较</Tag>
            ) : (
              <Tag>未触发偏好比较</Tag>
            )}
          </div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>{status.current_stage}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            任务编号 {status.task_id}
            {running && ' · 前端每 0.8s 轮询一次任务状态'}
          </div>
        </div>
      </div>

      <Row gutter={16} style={{ marginTop: 18 }}>
        <Col span={8}>
          <Statistic
            title="已处理照片"
            value={status.processed_count}
            suffix={`/ ${status.total_count}`}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="总体进度"
            value={status.progress}
            suffix="%"
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title="偏好比较"
            value={status.preference_triggered ? '已触发' : '已跳过'}
            valueStyle={{ fontSize: 20 }}
          />
        </Col>
      </Row>

      {status.status === 'all_poor' && (
        <Alert
          style={{ marginTop: 16 }}
          type="warning"
          showIcon
          message="本组照片质量均不理想"
          description="所有候选照片均未通过质量筛查，系统不会输出虚假的最佳推荐。建议改善光线或对焦后重新拍摄，或更换照片重新上传。"
        />
      )}

      {status.status === 'failed' && (
        <Alert
          style={{ marginTop: 16 }}
          type="error"
          showIcon
          message="任务执行失败"
          description={status.error ?? '处理过程中出现异常，请稍后重试。'}
        />
      )}
    </div>
  )
}
