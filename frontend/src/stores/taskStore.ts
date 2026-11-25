import { create } from 'zustand'
import { createTask, getTaskStatus } from '@/services/task'
import { getTaskResults } from '@/services/result'
import { submitFeedback as submitFeedbackApi } from '@/services/feedback'
import type { SelectionResult } from '@/types/result'
import type { CreateTaskParams, FeedbackType, TaskStatusPayload } from '@/types/task'
import { toLocalPhoto, type LocalPhoto } from '@/utils/image'

const DEFAULT_PARAMS: CreateTaskParams = {
  scene_type: 'auto',
  enable_crop: true,
  enable_preference: true,
  display_mode: 'full',
  demo_scenario: 'normal'
}

interface TaskState {
  photos: LocalPhoto[]
  params: CreateTaskParams
  submitting: boolean
  taskId: string | null
  status: TaskStatusPayload | null
  result: SelectionResult | null
  error: string | null
  /** 用户在结果页的最终选择 */
  selectedId: string | null
  feedbackSubmitted: boolean

  addPhotos: (files: File[]) => Promise<void>
  removePhoto: (uid: string) => void
  clearPhotos: () => void
  updateParams: (patch: Partial<CreateTaskParams>) => void
  setTaskId: (taskId: string) => void
  startTask: () => Promise<string | null>
  fetchStatus: () => Promise<TaskStatusPayload | null>
  fetchResult: () => Promise<void>
  selectCandidate: (candidateId: string) => void
  submitFeedback: (type: FeedbackType, reason?: string) => Promise<void>
  reset: () => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  photos: [],
  params: DEFAULT_PARAMS,
  submitting: false,
  taskId: null,
  status: null,
  result: null,
  error: null,
  selectedId: null,
  feedbackSubmitted: false,

  addPhotos: async (files) => {
    const created = await Promise.all(files.map(toLocalPhoto))
    set((state) => ({ photos: [...state.photos, ...created] }))
  },

  removePhoto: (uid) =>
    set((state) => ({ photos: state.photos.filter((p) => p.uid !== uid) })),

  clearPhotos: () => set({ photos: [] }),

  updateParams: (patch) => set((state) => ({ params: { ...state.params, ...patch } })),

  setTaskId: (taskId) =>
    set((state) =>
      state.taskId === taskId
        ? {}
        : {
            taskId,
            status: null,
            result: null,
            selectedId: null,
            feedbackSubmitted: false,
            error: null
          }
    ),

  startTask: async () => {
    const { photos, params } = get()
    if (photos.length < 1) {
      set({ error: '请先上传照片' })
      return null
    }
    set({ submitting: true, error: null })
    try {
      const res = await createTask(
        photos.map((p) => p.file),
        params
      )
      set({
        taskId: res.task_id,
        status: null,
        result: null,
        selectedId: null,
        feedbackSubmitted: false
      })
      return res.task_id
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '任务创建失败' })
      return null
    } finally {
      set({ submitting: false })
    }
  },

  fetchStatus: async () => {
    const { taskId } = get()
    if (!taskId) return null
    try {
      const status = await getTaskStatus(taskId)
      set({ status })
      return status
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '状态查询失败' })
      return null
    }
  },

  fetchResult: async () => {
    const { taskId } = get()
    if (!taskId) return
    try {
      const result = await getTaskResults(taskId)
      set({ result, selectedId: result.best_candidate_id })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : '结果获取失败' })
    }
  },

  selectCandidate: (candidateId) => set({ selectedId: candidateId, feedbackSubmitted: false }),

  submitFeedback: async (type, reason) => {
    const { taskId, result, selectedId } = get()
    if (!taskId || !result || !selectedId) return
    await submitFeedbackApi(taskId, {
      recommended_id: result.best_candidate_id ?? '',
      selected_id: selectedId,
      feedback_type: type,
      reason
    })
    set({ feedbackSubmitted: true })
  },

  reset: () =>
    set({
      photos: [],
      params: DEFAULT_PARAMS,
      taskId: null,
      status: null,
      result: null,
      error: null,
      selectedId: null,
      feedbackSubmitted: false,
      submitting: false
    })
}))
