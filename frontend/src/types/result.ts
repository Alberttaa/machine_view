import type { CandidateInfo } from './image'
import type { FeedbackType, TaskStatus } from './task'

/** 选片结果（对应设计文档 6.2 接口三） */
export interface SelectionResult {
  task_id: string
  status: TaskStatus
  best_candidate_id: string | null
  /** 多模态模型生成的推荐理由；后端未返回时为 null，前端不得自行编造 */
  explanation: string | null
  /** 推荐理由的结构化拆分，可选 */
  explanation_points?: string[]
  candidates: CandidateInfo[]
  /** 后端返回的置信度（若有），用于解释是否触发偏好比较 */
  confidence?: number
  /** 是否跳过了偏好比较环节 */
  preference_skipped?: boolean
}

/** 历史任务列表项 */
export interface HistoryItem {
  task_id: string
  task_name: string
  created_at: string
  photo_count: number
  status: 'completed' | 'failed' | 'processing' | 'all_poor'
  cover_url?: string
  best_candidate_id?: string
  feedback_type?: FeedbackType | null
}

/** 反馈记录 */
export interface FeedbackRecord {
  id: string
  task_id: string
  task_name: string
  recommended_id: string
  selected_id: string
  feedback_type: FeedbackType
  reason?: string
  created_at: string
}

/** 我的偏好页统计 */
export interface PreferenceSummary {
  sample_count: number
  accept_count: number
  override_count: number
  manual_select_count: number
  records: FeedbackRecord[]
}

/** 模型评估 */
export interface EvaluationMetric {
  module: string
  metric: string
  value: string
  status: 'measured' | 'pending'
  note?: string
}

export interface EvaluationSeries {
  name: string
  x: string[]
  values: number[]
}

export interface EvaluationData {
  metrics: EvaluationMetric[]
  ranking_series: EvaluationSeries[]
  module_compare: { module: string; baseline: number; improved: number }[]
  updated_at: string
  /** 数据是否为真实实验测量结果 */
  measured: boolean
}
