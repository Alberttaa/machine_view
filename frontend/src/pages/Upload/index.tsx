import { ExperimentOutlined, RocketOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Col, Divider, Radio, Row, Select, Space, Steps, Switch, Tag } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ImageUploader from '@/components/ImageUploader'
import { USE_MOCK } from '@/services/request'
import { useTaskStore } from '@/stores/taskStore'
import type { DemoScenario, DisplayMode, SceneType } from '@/types/task'
import { MIN_PHOTOS } from '@/utils/image'
import { SCENE_TEXT, formatFileSize } from '@/utils/format'

const SCENES: SceneType[] = ['auto', 'portrait', 'landscape', 'other']

const DEMO_OPTIONS: Array<{ value: DemoScenario; label: string; desc: string }> = [
  { value: 'normal', label: '低置信度任务', desc: '评分接近 → 触发偏好比较（完整流程）' },
  { value: 'high', label: '高置信度任务', desc: 'Top1 明显领先 → 跳过偏好比较' },
  { value: 'all_poor', label: '全部照片不理想', desc: '所有候选未通过质量筛查（异常演示）' },
  { value: 'failed', label: '任务执行失败', desc: '模型调用异常（异常演示）' }
]

export default function Upload() {
  const navigate = useNavigate()
  const { photos, params, submitting, error, addPhotos, removePhoto, clearPhotos, updateParams, startTask } =
    useTaskStore()
  const { message } = App.useApp()
  const [loadingSample, setLoadingSample] = useState(false)

  const enoughPhotos = photos.length >= MIN_PHOTOS

  const handleSubmit = async () => {
    if (!enoughPhotos) {
      message.warning(`至少需要 ${MIN_PHOTOS} 张照片才能开始选片`)
      return
    }
    const taskId = await startTask()
    if (taskId) navigate(`/task/${taskId}`)
  }

  /** 载入内置示例照片组：真实读取本地图片并构造 File，便于一键演示 */
  const loadSamples = async () => {
    setLoadingSample(true)
    try {
      const names = [
        'IMG_8102.jpg',
        'IMG_8103.jpg',
        'IMG_8105.jpg',
        'IMG_8106.jpg',
        'IMG_8107.jpg',
        'IMG_8110.jpg',
        'IMG_8112.jpg',
        'IMG_8114.jpg'
      ]
      const files = await Promise.all(
        names.map(async (name) => {
          const res = await fetch(`images/${name}`)
          const blob = await res.blob()
          return new File([blob], name, { type: 'image/jpeg' })
        })
      )
      const existing = new Set(photos.map((p) => p.name))
      const toAdd = files.filter((f) => !existing.has(f.name))
      if (!toAdd.length) {
        message.info('示例照片已在列表中')
        return
      }
      await addPhotos(toAdd)
      message.success(
        `已载入 ${toAdd.length} 张示例照片（${formatFileSize(toAdd.reduce((s, f) => s + f.size, 0))}）`
      )
    } catch {
      message.error('示例照片载入失败，请手动上传')
    } finally {
      setLoadingSample(false)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">开始选片</h1>
        <p className="page-sub">上传同一场景下的多张照片，系统自动筛选并推荐最佳照片。</p>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Steps
          size="small"
          current={0}
          items={[
            { title: '上传照片', description: '同一场景多张' },
            { title: '参数配置', description: '裁剪 / 偏好' },
            { title: '智能处理', description: '初筛 · 评分 · 比较' },
            { title: '查看结果', description: '推荐与理由' }
          ]}
        />
      </Card>

      <Row gutter={16}>
        <Col xs={24} lg={15}>
          <Card
            title="图片上传"
            extra={
              USE_MOCK ? (
                <Button
                  size="small"
                  icon={<ThunderboltOutlined />}
                  loading={loadingSample}
                  onClick={loadSamples}
                >
                  载入示例照片组
                </Button>
              ) : null
            }
          >
            <ImageUploader
              photos={photos}
              onAdd={addPhotos}
              onRemove={removePhoto}
              onClear={clearPhotos}
            />
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title="任务参数配置">
            <div className="config-row">
              <div>
                <div className="config-label">场景类型</div>
                <div className="config-desc">影响评分时的场景先验</div>
              </div>
              <Select
                size="small"
                style={{ width: 132 }}
                value={params.scene_type}
                onChange={(value) => updateParams({ scene_type: value })}
                options={SCENES.map((s) => ({ value: s, label: SCENE_TEXT[s] }))}
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className="config-row">
              <div>
                <div className="config-label">智能裁剪</div>
                <div className="config-desc">生成额外的裁剪候选图片</div>
              </div>
              <Switch
                size="small"
                checked={params.enable_crop}
                onChange={(v) => updateParams({ enable_crop: v })}
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className="config-row">
              <div>
                <div className="config-label">
                  个性化偏好
                  {!USE_MOCK && <Tag style={{ marginLeft: 6 }}>待接入</Tag>}
                </div>
                <div className="config-desc">在排序中参考历史偏好样本</div>
              </div>
              <Switch
                size="small"
                checked={params.enable_preference}
                onChange={(v) => updateParams({ enable_preference: v })}
              />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div className="config-row">
              <div>
                <div className="config-label">结果展示</div>
                <div className="config-desc">结果页是否展示完整排序</div>
              </div>
              <Radio.Group
                size="small"
                value={params.display_mode}
                onChange={(e) => updateParams({ display_mode: e.target.value as DisplayMode })}
              >
                <Radio.Button value="full">完整</Radio.Button>
                <Radio.Button value="best_only">仅最佳</Radio.Button>
              </Radio.Group>
            </div>

            {USE_MOCK && (
              <>
                <Divider style={{ margin: '14px 0' }}>
                  <Space size={4} style={{ fontSize: 11.5, color: '#8a919c' }}>
                    <ExperimentOutlined /> 演示场景（仅 Mock 生效）
                  </Space>
                </Divider>
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={params.demo_scenario}
                  onChange={(value) => updateParams({ demo_scenario: value })}
                  options={DEMO_OPTIONS.map((o) => ({
                    value: o.value,
                    label: (
                      <div>
                        <div style={{ fontSize: 12.5 }}>{o.label}</div>
                        <div style={{ fontSize: 11, color: '#8a919c' }}>{o.desc}</div>
                      </div>
                    )
                  }))}
                />
              </>
            )}

            <Divider style={{ margin: '16px 0' }} />

            <Button
              type="primary"
              block
              size="large"
              icon={<RocketOutlined />}
              loading={submitting}
              onClick={handleSubmit}
            >
              开始智能选片
            </Button>

            {!enoughPhotos && (
              <div className="muted" style={{ fontSize: 11.5, marginTop: 8, textAlign: 'center' }}>
                至少需要 {MIN_PHOTOS} 张照片
              </div>
            )}

            {error && (
              <Alert style={{ marginTop: 12 }} type="error" showIcon message={error} />
            )}
          </Card>

          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="关于演示数据" 
            description={
              USE_MOCK
                ? '当前为演示数据模式（VITE_USE_MOCK=true），分数与推荐理由均由前端 Mock 提供，接入算法后自动改用后端返回值。'
                : '已接入真实后端接口，页面展示的分数与理由均来自算法服务。'
            }
          />
        </Col>
      </Row>
    </div>
  )
}
