import { Empty, Progress } from 'antd'
import { formatScore } from '@/utils/format'

interface Props {
  scores?: Record<string, number>
  emptyText?: string
}

/** 评分面板：只渲染后端返回的维度，不预设维度名称 */
export default function ScorePanel({ scores, emptyText = '后端未返回评分维度' }: Props) {
  const entries = scores ? Object.entries(scores) : []

  if (!entries.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={emptyText}
        style={{ margin: '8px 0' }}
      />
    )
  }

  return (
    <div>
      {entries.map(([key, value]) => (
        <div className="dim-row" key={key}>
          <span>{key}</span>
          <Progress
            percent={Math.round(value * 100)}
            showInfo={false}
            size="small"
            strokeColor="#2563eb"
          />
          <span className="dim-value">{formatScore(value)}</span>
        </div>
      ))}
    </div>
  )
}
