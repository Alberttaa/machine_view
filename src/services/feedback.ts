import type { PreferenceSummary } from '@/types/result'
import type { FeedbackInfo } from '@/types/task'
import { request } from './request'

/** 接口五：提交用户反馈（accept / override / manual_select） */
export function submitFeedback(
  taskId: string,
  payload: Omit<FeedbackInfo, 'task_id' | 'created_at'>
): Promise<{ success: boolean }> {
  return request<{ success: boolean }>({
    method: 'post',
    url: `/tasks/${taskId}/feedback`,
    data: payload
  })
}

/** 接口七：获取用户偏好信息 */
export function getPreferences(): Promise<PreferenceSummary> {
  return request<PreferenceSummary>({ method: 'get', url: '/preferences' })
}
