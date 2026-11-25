import type { CandidateDetail } from '@/types/image'
import type {
  EvaluationData,
  FeedbackRecord,
  HistoryItem,
  PreferenceSummary,
  SelectionResult
} from '@/types/result'
import type {
  CreateTaskParams,
  DemoScenario,
  FeedbackType,
  TaskStatusPayload
} from '@/types/task'
import { buildCandidateDetail, buildResult, buildTimeline, type TimelineStep } from './data'

/**
 * 本地 Mock 服务：模拟后端任务队列与进度推进，接口路径、字段与真实后端保持一致。
 * 只有 VITE_USE_MOCK=true 时才会被 services/request.ts 调用。
 */

const FEEDBACK_KEY = 'sps.feedback.records'

interface MockTask {
  task_id: string
  scenario: DemoScenario
  enable_crop: boolean
  enable_preference: boolean
  display_mode: string
  scene_type: string
  photo_count: number
  created_at: number
  timeline: TimelineStep[]
}

const tasks = new Map<string, MockTask>()
const wait = (ms = 90) => new Promise((resolve) => setTimeout(resolve, ms))

const preferTriggered = (t: MockTask) => t.enable_preference && t.scenario === 'normal'

export function createMockTask(params: CreateTaskParams & { photo_count: number }) {
  const taskId = `task_${String(Date.now()).slice(-6)}`
  const scenario: DemoScenario = params.demo_scenario ?? 'normal'
  const enableCrop = params.enable_crop
  const triggered = params.enable_preference && scenario === 'normal'

  tasks.set(taskId, {
    task_id: taskId,
    scenario,
    enable_crop: enableCrop,
    enable_preference: params.enable_preference,
    display_mode: params.display_mode,
    scene_type: params.scene_type,
    photo_count: params.photo_count,
    created_at: Date.now(),
    timeline: buildTimeline(scenario, enableCrop, triggered)
  })
  return taskId
}

function taskStatus(task: MockTask): TaskStatusPayload {
  const elapsed = Date.now() - task.created_at
  const step = task.timeline.find((s) => elapsed < s.until) ?? task.timeline[task.timeline.length - 1]
  const processed = Math.min(
    task.photo_count,
    Math.max(1, Math.round((step.progress / 100) * task.photo_count))
  )

  return {
    task_id: task.task_id,
    status: step.status,
    progress: Math.min(100, step.progress),
    current_stage: step.stage,
    processed_count: step.status === 'pending' ? 0 : processed,
    total_count: task.photo_count,
    preference_triggered: preferTriggered(task),
    message: step.status === 'completed' ? '任务处理完成' : step.stage,
    error:
      step.status === 'failed'
        ? '结果解释模块调用失败（HTTP 502），请稍后重试或联系管理员'
        : undefined
  }
}

function readRecords(): FeedbackRecord[] {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '[]') as FeedbackRecord[]
  } catch {
    return []
  }
}

function writeRecords(records: FeedbackRecord[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(records))
}

const BASE_RECORDS: FeedbackRecord[] = [
  {
    id: 'fb_seed_1',
    task_id: 'task_100231',
    task_name: '午后街拍 · 8 张',
    recommended_id: 'candidate_002',
    selected_id: 'candidate_002',
    feedback_type: 'accept',
    created_at: '2026-10-28 15:12'
  },
  {
    id: 'fb_seed_2',
    task_id: 'task_100198',
    task_name: '夜景人像 · 6 张',
    recommended_id: 'candidate_001',
    selected_id: 'candidate_004',
    feedback_type: 'override',
    reason: '光线和色彩更好',
    created_at: '2026-10-26 21:40'
  }
]

const HISTORY: HistoryItem[] = [
  {
    task_id: 'task_100231',
    task_name: '午后街拍 · 8 张',
    created_at: '2026-10-28 15:10',
    photo_count: 8,
    status: 'completed',
    cover_url: 'images/candidate_002_crop.jpg',
    best_candidate_id: 'candidate_002',
    feedback_type: 'accept'
  },
  {
    task_id: 'task_100198',
    task_name: '夜景人像 · 6 张',
    created_at: '2026-10-26 21:38',
    photo_count: 6,
    status: 'completed',
    cover_url: 'images/IMG_8112.jpg',
    best_candidate_id: 'candidate_001',
    feedback_type: 'override'
  },
  {
    task_id: 'task_100142',
    task_name: '室内静物 · 4 张',
    created_at: '2026-10-22 10:05',
    photo_count: 4,
    status: 'all_poor',
    feedback_type: null
  },
  {
    task_id: 'task_100097',
    task_name: '阴天风景 · 5 张',
    created_at: '2026-10-18 09:22',
    photo_count: 5,
    status: 'failed',
    feedback_type: null
  }
]

const EVALUATION: EvaluationData = {
  measured: false,
  updated_at: '2026-11-02',
  metrics: [
    { module: '候选图片生成', metric: '有效候选比例', value: '—', status: 'pending', note: '待接入裁剪模块' },
    { module: '质量筛查', metric: '缺陷识别准确率', value: '—', status: 'pending', note: '待 SPS 标注集实验' },
    { module: '美学评分', metric: '排序相关性 (SRCC)', value: '—', status: 'pending', note: '待模型接入' },
    { module: '置信度评估', metric: '高低置信样本分布', value: '—', status: 'pending', note: '阈值待标定' },
    { module: '偏好模型', metric: 'Pairwise Accuracy', value: '—', status: 'pending', note: '待偏好模型训练' },
    { module: '系统整体', metric: 'Top-1 与人工选择一致率', value: '—', status: 'pending', note: '待端到端测试' }
  ],
  ranking_series: [
    { name: '美学评分', x: ['epoch 1', 'epoch 2', 'epoch 3', 'epoch 4'], values: [0, 0, 0, 0] },
    { name: '评分 + 偏好比较', x: ['epoch 1', 'epoch 2', 'epoch 3', 'epoch 4'], values: [0, 0, 0, 0] }
  ],
  module_compare: [
    { module: '质量筛查', baseline: 0, improved: 0 },
    { module: '美学评分', baseline: 0, improved: 0 },
    { module: '偏好比较', baseline: 0, improved: 0 }
  ]
}

/** 统一分发：路径与真实后端一致 */
export async function mockDispatch<T>(method: string, url: string, body?: unknown): Promise<T> {
  await wait()
  const path = url.replace(/\?.*$/, '')

  if (method === 'post' && path === '/tasks') {
    const payload = body as CreateTaskParams & { photo_count: number }
    const taskId = createMockTask(payload)
    return { task_id: taskId, status: 'pending', message: '任务创建成功' } as T
  }

  if (method === 'get' && /^\/tasks\/[^/]+$/.test(path)) {
    const taskId = path.split('/')[2]
    const task = tasks.get(taskId)
    if (!task) {
      // 刷新页面后内存任务丢失：直接返回完成状态，前端会自动跳到结果页
      return {
        task_id: taskId,
        status: 'completed',
        progress: 100,
        current_stage: '处理完成（演示环境任务已恢复）',
        processed_count: 8,
        total_count: 8,
        preference_triggered: true,
        message: '任务处理完成'
      } as T
    }
    return taskStatus(task) as T
  }

  if (method === 'get' && /^\/tasks\/[^/]+\/results$/.test(path)) {
    const taskId = path.split('/')[2]
    const task = tasks.get(taskId)
    // 历史任务或刷新页面后内存中已无任务，返回一份默认完成结果，保证结果页可直接打开
    const result: SelectionResult = task
      ? buildResult(taskId, task.scenario, task.enable_crop, preferTriggered(task))
      : buildResult(taskId, 'normal', true, true)
    return result as T
  }

  if (method === 'get' && /^\/tasks\/[^/]+\/candidates\/[^/]+$/.test(path)) {
    const [, , , , candidateId] = path.split('/')
    const taskId = path.split('/')[2]
    const enableCrop = tasks.get(taskId)?.enable_crop ?? true
    const detail = buildCandidateDetail(candidateId, enableCrop) as CandidateDetail | null
    if (!detail) throw new Error('候选照片不存在')
    return detail as T
  }

  if (method === 'post' && /^\/tasks\/[^/]+\/feedback$/.test(path)) {
    const taskId = path.split('/')[2]
    const payload = body as {
      recommended_id: string
      selected_id: string
      feedback_type: FeedbackType
      reason?: string
    }
    const record: FeedbackRecord = {
      id: `fb_${Date.now()}`,
      task_id: taskId,
      task_name: HISTORY.find((h) => h.task_id === taskId)?.task_name ?? '本次选片任务',
      recommended_id: payload.recommended_id,
      selected_id: payload.selected_id,
      feedback_type: payload.feedback_type,
      reason: payload.reason,
      created_at: new Date().toLocaleString('zh-CN', { hour12: false })
    }
    writeRecords([record, ...readRecords()])
    return { success: true, record } as T
  }

  if (method === 'get' && path === '/history') {
    return HISTORY as T
  }

  if (method === 'get' && path === '/preferences') {
    const records = [...readRecords(), ...BASE_RECORDS]
    const summary: PreferenceSummary = {
      sample_count: records.length,
      accept_count: records.filter((r) => r.feedback_type === 'accept').length,
      override_count: records.filter((r) => r.feedback_type === 'override').length,
      manual_select_count: records.filter((r) => r.feedback_type === 'manual_select').length,
      records
    }
    return summary as T
  }

  if (method === 'get' && path === '/evaluation') {
    return EVALUATION as T
  }

  throw new Error(`Mock 未实现的接口：${method.toUpperCase()} ${url}`)
}
