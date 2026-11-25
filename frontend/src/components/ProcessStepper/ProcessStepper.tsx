import { Steps, Tag } from 'antd'
import type { TaskStatus } from '@/types/task'

interface Props {
  status?: TaskStatus
  preferenceTriggered: boolean
  enableCrop: boolean
}

const STEPS: Array<{ key: TaskStatus; title: string; desc: string }> = [
  { key: 'cropping', title: '候选图片生成', desc: '原图与智能裁剪候选' },
  { key: 'preprocessing', title: '图片预处理', desc: '去重 / 方向校正 / 格式统一' },
  { key: 'quality', title: '图片质量筛查', desc: '曝光 / 模糊 / 重复检测' },
  { key: 'scoring', title: '美学评分', desc: '候选打分与初步排序' },
  { key: 'confidence', title: '置信度评估', desc: '判断排序是否可靠' },
  { key: 'preference', title: '偏好比较', desc: '条件执行：低置信度时触发' },
  { key: 'explaining', title: '结果解释', desc: '生成推荐理由' }
]

const STATUS_INDEX: Record<TaskStatus, number> = {
  pending: -1,
  cropping: 0,
  preprocessing: 1,
  quality: 2,
  scoring: 3,
  confidence: 4,
  preference: 5,
  explaining: 6,
  completed: 7,
  all_poor: 2,
  failed: 6
}

export default function ProcessStepper({ status, preferenceTriggered, enableCrop }: Props) {
  const current = status ? STATUS_INDEX[status] : -1
  const isError = status === 'failed' || status === 'all_poor'
  const aborted = isError

  const items = STEPS.map((step, index) => {
    const skipped =
      (step.key === 'cropping' && !enableCrop) ||
      (step.key === 'preference' && !preferenceTriggered)

    const stepStatus = skipped
      ? 'finish'
      : index < current || status === 'completed'
        ? 'finish'
        : index === current
          ? isError
            ? 'error'
            : 'process'
          : 'wait'

    return {
      title: (
        <span style={{ fontSize: 13 }}>
          {step.title}
          {skipped && (
            <Tag style={{ marginInlineStart: 6, fontSize: 11 }} color="default">
              {step.key === 'cropping' ? '未启用' : '已跳过'}
            </Tag>
          )}
        </span>
      ),
      description: (
        <span style={{ fontSize: 11.5, color: '#8a919c' }}>
          {skipped && step.key === 'preference'
            ? aborted
              ? '任务提前结束，未进入偏好比较'
              : '当前评分结果较为可靠，已跳过偏好比较'
            : step.desc}
        </span>
      ),
      status: stepStatus as 'finish' | 'process' | 'wait' | 'error'
    }
  })

  return <Steps current={Math.max(current, 0)} size="small" items={items} direction="vertical" />
}
