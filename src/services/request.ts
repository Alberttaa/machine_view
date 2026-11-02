import axios from 'axios'
import { mockDispatch } from './mock'

/**
 * 全局请求入口。
 * - VITE_USE_MOCK=true  → 由本地 Mock 分发，字段与真实接口一致
 * - VITE_USE_MOCK=false → axios 请求真实后端（/api 由 vite proxy 转发）
 * 业务代码只调用 services 里的方法，不直接使用 axios。
 */

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30_000
})

instance.interceptors.response.use(
  (res) => res,
  (error) => {
    const detail = error?.response?.data?.message || error?.message || '网络异常'
    return Promise.reject(new Error(detail))
  }
)

export interface RequestOptions {
  method: 'get' | 'post' | 'put' | 'delete'
  url: string
  /** 真实请求体：POST /tasks 为 FormData */
  data?: unknown
  /** Mock 模式下的入参（FormData 无法直接读取任务参数） */
  meta?: unknown
  params?: Record<string, unknown>
}

export async function request<T>({ method, url, data, meta, params }: RequestOptions): Promise<T> {
  if (USE_MOCK) {
    return mockDispatch<T>(method, url, meta ?? data)
  }
  const res = await instance.request<T>({ method, url, data, params })
  return res.data
}
