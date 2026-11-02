import type { HistoryItem } from '@/types/result'
import type { CreateTaskParams, TaskStatusPayload } from '@/types/task'
import { request } from './request'

export interface CreateTaskResponse {
  task_id: string
  status: string
  message: string
}

/** 接口一：创建选片任务 */
export async function createTask(
  files: File[],
  params: CreateTaskParams
): Promise<CreateTaskResponse> {
  const form = new FormData()
  files.forEach((file) => form.append('images', file, file.name))
  form.append('scene_type', params.scene_type)
  form.append('enable_crop', String(params.enable_crop))
  form.append('enable_preference', String(params.enable_preference))
  form.append('display_mode', params.display_mode)
  if (params.demo_scenario) form.append('demo_scenario', params.demo_scenario)

  return request<CreateTaskResponse>({
    method: 'post',
    url: '/tasks',
    data: form,
    // Mock 模式读不到 FormData，这里显式带上任务参数
    meta: { ...params, photo_count: files.length }
  })
}

/** 接口二：查询任务状态（前端定时轮询） */
export function getTaskStatus(taskId: string): Promise<TaskStatusPayload> {
  return request<TaskStatusPayload>({ method: 'get', url: `/tasks/${taskId}` })
}

/** 接口六：获取历史任务 */
export function getHistory(): Promise<HistoryItem[]> {
  return request<HistoryItem[]>({ method: 'get', url: '/history' })
}
