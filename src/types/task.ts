/** 任务状态与任务信息（对应设计文档 7.3） */

export type TaskStatus =
  | 'pending'
  | 'preprocessing'
  | 'cropping'
  | 'quality'
  | 'scoring'
  | 'confidence'
  | 'preference'
  | 'explaining'
  | 'completed'
  | 'all_poor'
  | 'failed'

export interface TaskInfo {
  task_id: string
  status: TaskStatus
  /** 0 - 100 */
  progress: number
  current_stage: string
  processed_count: number
  total_count: number
  /** 是否触发了偏好比较（条件执行模块） */
  preference_triggered: boolean
}

/** 任务状态接口返回值，比 TaskInfo 多提示与错误字段 */
export interface TaskStatusPayload extends TaskInfo {
  message?: string
  error?: string
}

export interface CreateTaskParams {
  scene_type: SceneType
  enable_crop: boolean
  enable_preference: boolean
  display_mode: DisplayMode
  /** 仅 Demo 使用：指定演示哪一类任务结果 */
  demo_scenario?: DemoScenario
}

export type SceneType = 'auto' | 'portrait' | 'landscape' | 'other'

export type DisplayMode = 'full' | 'best_only'

/**
 * 演示场景开关（仅 Mock 模式）：
 * normal / high 走正常完成，all_poor 与 failed 用于演示异常处理
 */
export type DemoScenario = 'normal' | 'high' | 'all_poor' | 'failed'

export type FeedbackType = 'accept' | 'override' | 'manual_select'

export interface FeedbackInfo {
  task_id: string
  recommended_id: string
  selected_id: string
  feedback_type: FeedbackType
  reason?: string
  created_at?: string
}
