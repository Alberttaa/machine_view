import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import type { CandidateInfo } from '@/types/image'
import { CANDIDATE_TYPE_TEXT, formatScore } from '@/utils/format'

interface Props {
  candidate: CandidateInfo
  best?: boolean
  selected?: boolean
  clickable?: boolean
  showRank?: boolean
  onClick?: () => void
  /** 查看详情（结果页跳转候选详情用） */
  onDetail?: () => void
}

export default function ImageCard({
  candidate,
  best = false,
  selected = false,
  clickable = false,
  showRank = true,
  onClick,
  onDetail
}: Props) {
  const rejected = candidate.quality_status === 'rejected'

  return (
    <article
      className={[
        'photo-card',
        clickable ? 'is-clickable' : '',
        selected ? 'is-selected' : '',
        rejected ? 'is-rejected' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={clickable ? onClick : undefined}
    >
      <div className="photo-thumb">
        <img src={candidate.image_url} alt={candidate.candidate_id} loading="lazy" />

        {showRank && candidate.rank ? <span className="photo-badge left">#{candidate.rank}</span> : null}

        <span className="photo-badge right">
          {CANDIDATE_TYPE_TEXT[candidate.candidate_type]}
        </span>

        {selected && (
          <CheckCircleFilled
            style={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              fontSize: 18,
              color: '#2563eb',
              background: '#fff',
              borderRadius: '50%'
            }}
          />
        )}

        {rejected && (
          <span className="photo-veil">
            <CloseCircleOutlined /> 已筛除 ·{' '}
            {String(candidate.quality_info?.reason ?? '未通过质量筛查')}
          </span>
        )}
      </div>

      <div className="photo-meta">
        <div className="photo-meta-title">
          <span className="photo-id">{candidate.candidate_id}</span>
          <span className="photo-score">
            {rejected ? '—' : formatScore(candidate.total_score)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {best && <Tag color="blue" style={{ margin: 0 }}>系统推荐</Tag>}
          {selected && !best && <Tag color="geekblue" style={{ margin: 0 }}>我的选择</Tag>}
          {rejected ? (
            <Tag color="error" style={{ margin: 0 }}>已筛除</Tag>
          ) : (
            <Tag color="success" style={{ margin: 0 }}>通过筛查</Tag>
          )}
          {onDetail && (
            <a
              style={{ marginLeft: 'auto', fontSize: 11.5 }}
              onClick={(e) => {
                e.stopPropagation()
                onDetail()
              }}
            >
              详情
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
