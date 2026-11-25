import { CheckCircleOutlined, LinkOutlined } from '@ant-design/icons'
import { Alert, Button, Divider, Radio, Select, Space, Tag } from 'antd'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { FeedbackType } from '@/types/task'
import { FEEDBACK_REASONS } from '@/utils/format'

interface Props {
  taskId: string
  recommendedId: string | null
  selectedId: string | null
  submitted: boolean
  submitting?: boolean
  onSubmit: (type: FeedbackType, reason?: string) => Promise<void> | void
  onRestore: () => void
}

export default function FeedbackPanel({
  taskId,
  recommendedId,
  selectedId,
  submitted,
  submitting,
  onSubmit,
  onRestore
}: Props) {
  const [reason, setReason] = useState<string>()
  const [overrideType, setOverrideType] = useState<Exclude<FeedbackType, 'accept'>>('override')

  const isRecommended = !!selectedId && selectedId === recommendedId

  if (submitted) {
    return (
      <div>
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="反馈已提交"
          description={
            <div style={{ fontSize: 12.5, lineHeight: 1.8 }}>
              已记录：系统推荐 <b>{recommendedId ?? '—'}</b> · 你的选择 <b>{selectedId ?? '—'}</b>
              。反馈将作为偏好样本保存到后端，用于后续个性化排序。
              <div style={{ marginTop: 6 }}>
                <Link to="/preferences">
                  <LinkOutlined /> 查看我的偏好记录
                </Link>
              </div>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12.5 }}>
          <span className="muted">系统推荐</span>
          <Tag color="blue" style={{ margin: 0 }}>
            {recommendedId ?? '—'}
          </Tag>
          <span className="muted">你的选择</span>
          <Tag color={isRecommended ? 'default' : 'geekblue'} style={{ margin: 0 }}>
            {selectedId ?? '未选择'}
          </Tag>
        </div>

        {!isRecommended && (
          <>
            <Radio.Group
              size="small"
              value={overrideType}
              onChange={(e) => setOverrideType(e.target.value)}
            >
              <Radio.Button value="override">更换推荐</Radio.Button>
              <Radio.Button value="manual_select">手动指定</Radio.Button>
            </Radio.Group>

            <Select
              allowClear
              size="small"
              placeholder="选择反馈原因（可选）"
              style={{ width: '100%' }}
              value={reason}
              onChange={setReason}
              options={FEEDBACK_REASONS.map((item) => ({ value: item, label: item }))}
            />
          </>
        )}

        <Divider style={{ margin: '4px 0' }} />

        <Space wrap>
          {isRecommended ? (
            <Button type="primary" loading={submitting} onClick={() => onSubmit('accept')}>
              接受推荐
            </Button>
          ) : (
            <>
              <Button
                type="primary"
                loading={submitting}
                onClick={() => onSubmit(overrideType, reason)}
              >
                {overrideType === 'override' ? '确认更换并提交' : '确认指定并提交'}
              </Button>
              <Button onClick={onRestore}>恢复系统推荐</Button>
            </>
          )}
        </Space>

        <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.7 }}>
          提交内容：task_id={taskId}、系统推荐 id、最终选择 id、反馈类型{reason ? '、反馈原因' : ''}
        </div>
      </Space>
    </div>
  )
}
