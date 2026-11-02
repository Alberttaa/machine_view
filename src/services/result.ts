import type { CandidateDetail } from '@/types/image'
import type { SelectionResult } from '@/types/result'
import { request } from './request'

/** 接口三：获取选片结果 */
export function getTaskResults(taskId: string): Promise<SelectionResult> {
  return request<SelectionResult>({ method: 'get', url: `/tasks/${taskId}/results` })
}

/** 接口四：获取候选照片详情 */
export function getCandidateDetail(
  taskId: string,
  candidateId: string
): Promise<CandidateDetail> {
  return request<CandidateDetail>({
    method: 'get',
    url: `/tasks/${taskId}/candidates/${candidateId}`
  })
}
