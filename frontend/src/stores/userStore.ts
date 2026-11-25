import { create } from 'zustand'
import { getHistory } from '@/services/task'
import { getPreferences } from '@/services/feedback'
import { getEvaluation } from '@/services/evaluation'
import type { EvaluationData, HistoryItem, PreferenceSummary } from '@/types/result'

interface UserState {
  history: HistoryItem[]
  preferences: PreferenceSummary | null
  evaluation: EvaluationData | null
  loading: boolean
  error: string | null

  loadHistory: () => Promise<void>
  loadPreferences: () => Promise<void>
  loadEvaluation: () => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  history: [],
  preferences: null,
  evaluation: null,
  loading: false,
  error: null,

  loadHistory: async () => {
    set({ loading: true, error: null })
    try {
      set({ history: await getHistory() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '历史任务加载失败' })
    } finally {
      set({ loading: false })
    }
  },

  loadPreferences: async () => {
    set({ loading: true, error: null })
    try {
      set({ preferences: await getPreferences() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '偏好信息加载失败' })
    } finally {
      set({ loading: false })
    }
  },

  loadEvaluation: async () => {
    set({ loading: true, error: null })
    try {
      set({ evaluation: await getEvaluation() })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '评估数据加载失败' })
    } finally {
      set({ loading: false })
    }
  }
}))
