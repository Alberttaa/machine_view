import { ArrowLeftOutlined, CheckOutlined, PictureOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Descriptions, Empty, Row, Skeleton, Space, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ImagePreview from '@/components/ImagePreview'
import ScorePanel from '@/components/ScorePanel'
import { getCandidateDetail } from '@/services/result'
import { useTaskStore } from '@/stores/taskStore'
import type { CandidateDetail as CandidateDetailType } from '@/types/image'
import { CANDIDATE_TYPE_TEXT, formatScore } from '@/utils/format'

export default function CandidateDetail() {
  const { taskId, candidateId } = useParams()
  const navigate = useNavigate()
  const selectCandidate = useTaskStore((s) => s.selectCandidate)
  const bestId = useTaskStore((s) => s.result?.best_candidate_id)

  const [detail, setDetail] = useState<CandidateDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!taskId || !candidateId) return
      setLoading(true)
      try {
        const data = await getCandidateDetail(taskId, candidateId)
        if (!cancelled) setDetail(data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [taskId, candidateId])

  if (loading) {
    return (
      <div className="page">
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="page">
        <Card>
          <Empty description={error ?? '未找到该候选照片'}>
            <Button onClick={() => navigate(-1)}>返回</Button>
          </Empty>
        </Card>
      </div>
    )
  }

  const rejected = detail.quality_status === 'rejected'
  const qualityEntries = detail.quality_info ? Object.entries(detail.quality_info) : []

  return (
    <div className="page">
      <div className="page-head">
        <Space size={10} align="center">
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h1 className="page-title" style={{ margin: 0 }}>
            候选详情 · {detail.candidate_id}
          </h1>
          <Tag color={CANDIDATE_TYPE_TEXT[detail.candidate_type] === '智能裁剪' ? 'purple' : 'default'}>
            {CANDIDATE_TYPE_TEXT[detail.candidate_type]}
          </Tag>
          {rejected && <Tag color="error">已筛除</Tag>}
          {detail.candidate_id === bestId && <Tag color="blue">系统推荐</Tag>}
        </Space>
        <p className="page-sub" style={{ marginTop: 6 }}>
          任务编号 {taskId}
        </p>
      </div>

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="图片预览">
            <div className="best-photo">
              <ImagePreview src={detail.image_url} alt={detail.candidate_id} />
            </div>
            {detail.candidate_type === 'crop' && detail.source_image_url && (
              <>
                <div style={{ marginTop: 16, marginBottom: 8, fontSize: 13, fontWeight: 600 }}>
                  原图对比
                </div>
                <div className="compare-grid">
                  <div>
                    <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>
                      原始照片 {detail.source_image_id}
                    </div>
                    <div className="best-photo" style={{ aspectRatio: '3 / 2' }}>
                      <ImagePreview src={detail.source_image_url} alt="source" />
                    </div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 11.5, marginBottom: 4 }}>
                      裁剪候选 {detail.candidate_id}
                    </div>
                    <div className="best-photo" style={{ aspectRatio: '3 / 2' }}>
                      <ImagePreview src={detail.image_url} alt="crop" />
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" colon={false}>
              <Descriptions.Item label="候选编号">{detail.candidate_id}</Descriptions.Item>
              <Descriptions.Item label="来源照片">{detail.source_image_id}</Descriptions.Item>
              <Descriptions.Item label="图片类型">
                {CANDIDATE_TYPE_TEXT[detail.candidate_type]}
              </Descriptions.Item>
              {detail.crop_box && (
                <Descriptions.Item label="裁剪参数">
                  x={detail.crop_box[0]}, y={detail.crop_box[1]}, w={detail.crop_box[2]}, h=
                  {detail.crop_box[3]}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="质量状态">
                {rejected ? <Tag color="error">未通过筛查</Tag> : <Tag color="success">通过筛查</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="排名">
                {detail.rank ? `第 ${detail.rank} 名` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="偏好比较">
                {detail.in_preference ? <Tag color="geekblue">已参与</Tag> : <Tag>未参与</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="综合评分">
                <b>{formatScore(detail.total_score)}</b>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="质量检测结果" style={{ marginBottom: 16 }}>
            {qualityEntries.length ? (
              <Descriptions column={1} size="small" colon={false}>
                {qualityEntries.map(([key, value]) => (
                  <Descriptions.Item label={key}>{String(value)}</Descriptions.Item>
                ))}
              </Descriptions>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未返回质量检测明细" />
            )}
          </Card>

          <Card title="美学评分" style={{ marginBottom: 16 }}>
            <ScorePanel scores={detail.aesthetic_scores} />
          </Card>

          {!rejected ? (
            <Space style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                block
                onClick={() => {
                  selectCandidate(detail.candidate_id)
                  navigate(`/result/${taskId}`)
                }}
              >
                设为最终选择
              </Button>
              <Button icon={<PictureOutlined />} onClick={() => navigate(`/result/${taskId}`)}>
                返回结果页
              </Button>
            </Space>
          ) : (
            <Alert
              type="warning"
              showIcon
              message="该候选未通过质量筛查"
              description="已筛除的照片不能作为最终选择，但可在结果页的「已筛除照片」中查看筛除原因。"
            />
          )}
        </Col>
      </Row>
    </div>
  )
}
