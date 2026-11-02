import {
  DownloadOutlined,
  DownOutlined,
  PictureOutlined,
  ReloadOutlined,
  RightOutlined
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Row,
  Skeleton,
  Space,
  Tag
} from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FeedbackPanel from '@/components/FeedbackPanel'
import ImageCard from '@/components/ImageCard'
import ImagePreview from '@/components/ImagePreview'
import ScorePanel from '@/components/ScorePanel'
import { useTaskStore } from '@/stores/taskStore'
import type { FeedbackType } from '@/types/task'
import { CANDIDATE_TYPE_TEXT, formatScore } from '@/utils/format'

export default function Result() {
  const { taskId } = useParams()
  const navigate = useNavigate()
  const taskIdInStore = useTaskStore((s) => s.taskId)
  const setTaskId = useTaskStore((s) => s.setTaskId)
  const result = useTaskStore((s) => s.result)
  const fetchResult = useTaskStore((s) => s.fetchResult)
  const selectedId = useTaskStore((s) => s.selectedId)
  const selectCandidate = useTaskStore((s) => s.selectCandidate)
  const feedbackSubmitted = useTaskStore((s) => s.feedbackSubmitted)
  const submitFeedback = useTaskStore((s) => s.submitFeedback)
  const error = useTaskStore((s) => s.error)
  const params = useTaskStore((s) => s.params)

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAll, setShowAll] = useState(params.display_mode === 'full')
  const [sourcePreview, setSourcePreview] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    if (taskIdInStore !== taskId) setTaskId(taskId)
  }, [taskId, taskIdInStore, setTaskId])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (result?.task_id === taskId) {
        setLoading(false)
        return
      }
      await fetchResult()
      if (!cancelled) setLoading(false)
    }
    run()
    return () => {
      cancelled = true
    }
  }, [taskId, result?.task_id, fetchResult])

  const best = useMemo(
    () => result?.candidates.find((c) => c.candidate_id === result.best_candidate_id),
    [result]
  )
  const passed = useMemo(
    () => result?.candidates.filter((c) => c.quality_status === 'passed') ?? [],
    [result]
  )
  const rejected = useMemo(
    () => result?.candidates.filter((c) => c.quality_status === 'rejected') ?? [],
    [result]
  )
  /** 裁剪推荐对应的原图候选 */
  const originCandidate = useMemo(() => {
    if (!best || best.candidate_type !== 'crop') return undefined
    return result?.candidates.find(
      (c) =>
        c.candidate_type === 'original' &&
        c.source_image_id === best.source_image_id &&
        c.candidate_id !== best.candidate_id
    )
  }, [best, result])

  const handleFeedback = async (type: FeedbackType, reason?: string) => {
    setSubmitting(true)
    try {
      await submitFeedback(type, reason)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="page">
        <Card>
          <Empty description={error ?? '未找到该任务的选片结果'}>
            <Space>
              <Button type="primary" onClick={() => navigate('/')}>
                重新开始选片
              </Button>
              <Button onClick={() => navigate('/history')}>查看历史任务</Button>
            </Space>
          </Empty>
        </Card>
      </div>
    )
  }

  /** 全部照片不合格：不展示虚假推荐 */
  if (result.status === 'all_poor' || !best) {
    return (
      <div className="page">
        <div className="page-head">
          <h1 className="page-title">选片结果</h1>
          <p className="page-sub">任务编号 {result.task_id}</p>
        </div>
        <Card>
          <Alert
            type="warning"
            showIcon
            message="本组照片质量均不理想，未生成推荐结果"
            description="所有候选照片均未通过质量筛查（失焦、过曝、重复等）。系统不会输出虚假的最佳推荐，建议改善拍摄条件后重新上传。"
          />
          <Divider />
          <div style={{ marginBottom: 10, fontSize: 13 }}>
            已筛除照片（{rejected.length}）
          </div>
          <Row gutter={[12, 12]}>
            {rejected.map((c) => (
              <Col xs={12} md={8} lg={6} key={c.candidate_id}>
                <ImageCard candidate={c} showRank={false} />
              </Col>
            ))}
          </Row>
          <Divider />
          <Space>
            <Button type="primary" icon={<ReloadOutlined />} onClick={() => navigate('/')}>
              重新上传照片
            </Button>
            <Button onClick={() => navigate('/history')}>查看历史任务</Button>
          </Space>
        </Card>
      </div>
    )
  }

  const visibleCandidates = showAll ? passed : passed.slice(0, 1)

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">选片结果</h1>
        <p className="page-sub">
          任务编号 {result.task_id} · 共 {result.candidates.length} 个候选 ·{' '}
          {passed.length} 个通过质量筛查
        </p>
      </div>

      <div className="best-wrap">
        <Card
          title={
            <Space size={8}>
              <span>最佳照片</span>
              <Tag color="blue">系统推荐</Tag>
              <Tag>{CANDIDATE_TYPE_TEXT[best.candidate_type]}</Tag>
            </Space>
          }
          extra={
            <Space size={6}>
              <a href={best.image_url} download>
                <Button size="small" icon={<DownloadOutlined />}>
                  保存
                </Button>
              </a>
              {originCandidate && (
                <Button
                  size="small"
                  icon={<PictureOutlined />}
                  onClick={() => setSourcePreview(originCandidate.image_url)}
                >
                  查看原图
                </Button>
              )}
            </Space>
          }
        >
          <div className="best-photo">
            <ImagePreview src={best.image_url} alt={best.candidate_id} />
            <span className="best-tag">推荐 · 第 1 名</span>
          </div>

          <Descriptions column={2} size="small" style={{ marginTop: 14 }} colon={false}>
            <Descriptions.Item label="候选编号">{best.candidate_id}</Descriptions.Item>
            <Descriptions.Item label="综合评分">
              <b>{formatScore(best.total_score)}</b>
            </Descriptions.Item>
            <Descriptions.Item label="来源照片">{best.source_image_id}</Descriptions.Item>
            <Descriptions.Item label="图片类型">
              {CANDIDATE_TYPE_TEXT[best.candidate_type]}
            </Descriptions.Item>
          </Descriptions>

          {best.candidate_type === 'crop' && (
            <Alert
              style={{ marginTop: 10 }}
              type="info"
              showIcon
              message="该推荐结果为智能裁剪候选"
              description={`由原始照片 ${best.source_image_id} 裁剪生成，可点击「查看原图」对比裁剪前后构图。`}
            />
          )}
        </Card>

        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card title="推荐理由" extra={<Tag>多模态模型生成</Tag>}>
            {result.explanation ? (
              <>
                <div style={{ fontSize: 13.5, lineHeight: 1.9 }}>{result.explanation}</div>
                {result.explanation_points?.length ? (
                  <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: 12.5, lineHeight: 2 }}>
                    {result.explanation_points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <Alert
                type="info"
                showIcon
                message="后端未返回推荐理由"
                description="接入多模态解释模块后，此处将展示由模型生成的选片理由。"
              />
            )}
          </Card>

          <Card title="评分信息" extra={<span className="muted" style={{ fontSize: 12 }}>维度由后端返回</span>}>
            <div style={{ marginBottom: 10, fontSize: 13 }}>
              综合评分 <b style={{ fontSize: 18, color: '#1d4ed8' }}>{formatScore(best.total_score)}</b>
              <span className="muted" style={{ fontSize: 12 }}> / 100</span>
            </div>
            <ScorePanel scores={best.aesthetic_scores} />
          </Card>

          <Card title="置信度与决策">
            <Space direction="vertical" size={8} style={{ width: '100%', fontSize: 12.5 }}>
              <div>
                置信度：<b>{result.confidence !== undefined ? result.confidence.toFixed(2) : '—'}</b>
              </div>
              <div>
                偏好比较环节：
                {result.preference_skipped ? (
                  <Tag color="default">已跳过（当前评分结果较为可靠）</Tag>
                ) : (
                  <Tag color="geekblue">已执行</Tag>
                )}
              </div>
            </Space>
          </Card>
        </Space>
      </div>

      <Card
        className="section-gap"
        title={`候选照片（${passed.length}）`}
        extra={
          !showAll ? (
            <Button size="small" type="link" onClick={() => setShowAll(true)}>
              查看完整排序 <DownOutlined />
            </Button>
          ) : (
            <span className="muted" style={{ fontSize: 12 }}>
              当前展示完整排序
            </span>
          )
        }
      >
        <Row gutter={[12, 12]}>
          {(visibleCandidates.length ? visibleCandidates : passed).map((c) => (
            <Col xs={12} md={8} lg={6} key={c.candidate_id}>
              <ImageCard
                candidate={c}
                best={c.candidate_id === result.best_candidate_id}
                selected={c.candidate_id === selectedId}
                clickable
                onClick={() => selectCandidate(c.candidate_id)}
                onDetail={() => navigate(`/candidate/${result.task_id}/${c.candidate_id}`)}
              />
            </Col>
          ))}
        </Row>
        {!showAll && passed.length > 1 && (
          <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            结果展示模式为「仅最佳」，已隐藏其余 {passed.length - 1} 个候选。
          </div>
        )}
      </Card>

      {rejected.length > 0 && (
        <Collapse
          className="section-gap"
          items={[
            {
              key: 'rejected',
              label: `已筛除照片（${rejected.length}）· 未通过质量筛查，点击展开查看原因`,
              children: (
                <Row gutter={[12, 12]}>
                  {rejected.map((c) => (
                    <Col xs={12} md={8} lg={6} key={c.candidate_id}>
                      <ImageCard candidate={c} showRank={false} />
                    </Col>
                  ))}
                </Row>
              )
            }
          ]}
        />
      )}

      <Card className="section-gap" title="你的选择">
        <Row gutter={20}>
          <Col xs={24} md={10}>
            <FeedbackPanel
              taskId={result.task_id}
              recommendedId={result.best_candidate_id}
              selectedId={selectedId}
              submitted={feedbackSubmitted}
              submitting={submitting}
              onSubmit={handleFeedback}
              onRestore={() => selectCandidate(result.best_candidate_id ?? '')}
            />
          </Col>
          <Col xs={24} md={14}>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.9 }}>
              操作说明：
              <div>
                · 在上方候选照片中点击任意一张，即可把它设为你的最终选择（当前选择会有蓝色边框与勾选标识）。
              </div>
              <div>· 若与系统推荐一致，提交类型为「接受推荐」；不一致时可选择「更换推荐」或「手动指定」。</div>
              <div>· 前端只负责提交反馈，偏好记忆库的更新由后端完成。</div>
            </div>
            {!feedbackSubmitted && selectedId && selectedId !== result.best_candidate_id && (
              <Alert
                style={{ marginTop: 12 }}
                type="info"
                showIcon
                message={`当前选择已改为 ${selectedId}`}
                description="确认无误后点击左侧「确认更换并提交」，该样本会作为偏好反馈记录。"
                action={
                  <Button
                    size="small"
                    onClick={() => navigate(`/candidate/${result.task_id}/${selectedId}`)}
                  >
                    查看详情 <RightOutlined />
                  </Button>
                }
              />
            )}
          </Col>
        </Row>
      </Card>

      <Modal
        open={!!sourcePreview}
        footer={null}
        onCancel={() => setSourcePreview(null)}
        width={760}
        title="原始照片（对照裁剪结果）"
      >
        {sourcePreview && <ImagePreview src={sourcePreview} alt="source" style={{ width: '100%' }} />}
      </Modal>
    </div>
  )
}
