import type { EvaluationData } from '@/types/result'
import { request } from './request'

/** 接口八：获取模型评估结果 */
export function getEvaluation(): Promise<EvaluationData> {
  return request<EvaluationData>({ method: 'get', url: '/evaluation' })
}
