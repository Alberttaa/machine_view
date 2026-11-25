import type { FeedbackType, SceneType, TaskStatus } from '@/types/task'

/** 后端评分统一为 0-1，展示为 0-100 制 */
export const formatScore = (value?: number): string =>
  value === undefined || value === null ? '—' : (value * 100).toFixed(1)

export const formatPercent = (value?: number): string =>
  value === undefined || value === null ? '—' : `${Math.round(value * 100)}%`

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const formatDateTime = (value?: string): string => value ?? '—'

export const TASK_STATUS_TEXT: Record<TaskStatus, string> = {
  pending: '等待处理',
  preprocessing: '图片预处理中',
  cropping: '候选图片生成中',
  quality: '图片质量筛查中',
  scoring: '美学评分中',
  confidence: '置信度评估中',
  preference: '偏好比较中',
  explaining: '生成推荐理由中',
  completed: '处理完成',
  all_poor: '照片质量不理想',
  failed: '处理失败'
}

export const TASK_STATUS_COLOR: Record<TaskStatus, string> = {
  pending: 'default',
  preprocessing: 'processing',
  cropping: 'processing',
  quality: 'processing',
  scoring: 'processing',
  confidence: 'processing',
  preference: 'processing',
  explaining: 'processing',
  completed: 'success',
  all_poor: 'warning',
  failed: 'error'
}

export const FEEDBACK_TEXT: Record<FeedbackType, string> = {
  accept: '接受推荐',
  override: '更换推荐',
  manual_select: '手动指定'
}

export const SCENE_TEXT: Record<SceneType, string> = {
  auto: '自动识别',
  portrait: '人像',
  landscape: '风景',
  other: '其他'
}

export const CANDIDATE_TYPE_TEXT = {
  original: '原始照片',
  crop: '智能裁剪'
} as const

export const FEEDBACK_REASONS = [
  '构图更合适',
  '人物表情更自然',
  '主体更加清晰',
  '光线和色彩更好',
  '其他原因'
]
