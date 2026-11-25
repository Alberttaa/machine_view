import type { CandidateInfo, CandidateDetail, ImageInfo } from '@/types/image'
import type { SelectionResult } from '@/types/result'
import type { DemoScenario, TaskStatus } from '@/types/task'

/**
 * 演示数据（Mock）。
 * 字段结构严格按 docs/接口与数据结构.md 与 src/types 定义，
 * 联调后把 VITE_USE_MOCK 改成 false 即可切到真实接口。
 */

export interface SampleImage extends ImageInfo {
  /** 该照片是否有裁剪候选 */
  has_crop?: boolean
}

export const SAMPLE_IMAGES: SampleImage[] = [
  { image_id: 'image_001', file_name: 'IMG_8102.jpg', image_url: 'images/IMG_8102.jpg', width: 960, height: 640, file_size: 42969, has_crop: true },
  { image_id: 'image_002', file_name: 'IMG_8103.jpg', image_url: 'images/IMG_8103.jpg', width: 960, height: 640, file_size: 103758 },
  { image_id: 'image_003', file_name: 'IMG_8105.jpg', image_url: 'images/IMG_8105.jpg', width: 960, height: 640, file_size: 93341 },
  { image_id: 'image_004', file_name: 'IMG_8106.jpg', image_url: 'images/IMG_8106.jpg', width: 960, height: 640, file_size: 165819 },
  { image_id: 'image_005', file_name: 'IMG_8107.jpg', image_url: 'images/IMG_8107.jpg', width: 960, height: 640, file_size: 114809 },
  { image_id: 'image_006', file_name: 'IMG_8110.jpg', image_url: 'images/IMG_8110.jpg', width: 960, height: 640, file_size: 43211 },
  { image_id: 'image_007', file_name: 'IMG_8112.jpg', image_url: 'images/IMG_8112.jpg', width: 960, height: 640, file_size: 68517 },
  { image_id: 'image_008', file_name: 'IMG_8114.jpg', image_url: 'images/IMG_8114.jpg', width: 960, height: 640, file_size: 119047 }
]

const imageUrl = (id: string) => SAMPLE_IMAGES.find((i) => i.image_id === id)?.image_url ?? ''

interface Seed {
  candidate_id: string
  source_image_id: string
  image_url: string
  candidate_type: 'original' | 'crop'
  crop_box?: [number, number, number, number]
  quality_status: 'passed' | 'rejected'
  quality_info?: Record<string, unknown>
  aesthetic_scores?: Record<string, number>
  total_score?: number
}

const PASSED_SEEDS: Seed[] = [
  {
    candidate_id: 'candidate_002',
    source_image_id: 'image_001',
    image_url: 'images/candidate_002_crop.jpg',
    candidate_type: 'crop',
    crop_box: [96, 38, 768, 563],
    quality_status: 'passed',
    aesthetic_scores: { 构图: 0.92, 色彩: 0.88, 光影: 0.9, 清晰度: 0.87, 主体: 0.88 },
    total_score: 0.891
  },
  {
    candidate_id: 'candidate_001',
    source_image_id: 'image_001',
    image_url: imageUrl('image_001'),
    candidate_type: 'original',
    quality_status: 'passed',
    aesthetic_scores: { 构图: 0.84, 色彩: 0.89, 光影: 0.88, 清晰度: 0.86, 主体: 0.9 },
    total_score: 0.874
  },
  {
    candidate_id: 'candidate_004',
    source_image_id: 'image_007',
    image_url: imageUrl('image_007'),
    candidate_type: 'original',
    quality_status: 'passed',
    aesthetic_scores: { 构图: 0.79, 色彩: 0.91, 光影: 0.93, 清晰度: 0.86, 主体: 0.82 },
    total_score: 0.862
  },
  {
    candidate_id: 'candidate_003',
    source_image_id: 'image_003',
    image_url: imageUrl('image_003'),
    candidate_type: 'original',
    quality_status: 'passed',
    aesthetic_scores: { 构图: 0.88, 色彩: 0.82, 光影: 0.84, 清晰度: 0.87, 主体: 0.84 },
    total_score: 0.856
  },
  {
    candidate_id: 'candidate_005',
    source_image_id: 'image_002',
    image_url: imageUrl('image_002'),
    candidate_type: 'original',
    quality_status: 'passed',
    aesthetic_scores: { 构图: 0.82, 色彩: 0.84, 光影: 0.8, 清晰度: 0.79, 主体: 0.82 },
    total_score: 0.815
  },
  {
    candidate_id: 'candidate_006',
    source_image_id: 'image_008',
    image_url: imageUrl('image_008'),
    candidate_type: 'original',
    quality_status: 'passed',
    aesthetic_scores: { 构图: 0.76, 色彩: 0.8, 光影: 0.79, 清晰度: 0.77, 主体: 0.79 },
    total_score: 0.783
  }
]

const REJECTED_SEEDS: Seed[] = [
  {
    candidate_id: 'candidate_007',
    source_image_id: 'image_004',
    image_url: imageUrl('image_004'),
    candidate_type: 'original',
    quality_status: 'rejected',
    quality_info: { blur_score: 0.08, threshold: 0.30, reason: '严重失焦' }
  },
  {
    candidate_id: 'candidate_008',
    source_image_id: 'image_005',
    image_url: imageUrl('image_005'),
    candidate_type: 'original',
    quality_status: 'rejected',
    quality_info: { duplicate_of: 'image_001', similarity: 0.98, reason: '重复图像' }
  },
  {
    candidate_id: 'candidate_009',
    source_image_id: 'image_006',
    image_url: imageUrl('image_006'),
    candidate_type: 'original',
    quality_status: 'rejected',
    quality_info: { overexposed_ratio: 0.34, threshold: 0.15, reason: '明显过曝' }
  }
]

function withRank(seeds: Seed[]): CandidateInfo[] {
  return seeds.map((seed, index) => ({
    ...seed,
    rank: seed.quality_status === 'passed' ? index + 1 : undefined
  }))
}

/** 高置信场景：Top1 明显领先，偏好比较被跳过 */
const HIGH_SCORE_SEEDS: Seed[] = PASSED_SEEDS.map((seed) => {
  if (seed.candidate_id === 'candidate_001') {
    return {
      ...seed,
      total_score: 0.925,
      aesthetic_scores: { 构图: 0.93, 色彩: 0.92, 光影: 0.92, 清晰度: 0.91, 主体: 0.94 }
    }
  }
  if (seed.candidate_id === 'candidate_002') {
    return {
      ...seed,
      total_score: 0.862,
      aesthetic_scores: { 构图: 0.88, 色彩: 0.86, 光影: 0.87, 清晰度: 0.85, 主体: 0.85 }
    }
  }
  return seed
}).sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))

/** 全部不合格场景：所有候选都被质量筛查淘汰 */
const ALL_POOR_SEEDS: Seed[] = [
  ...PASSED_SEEDS.slice(0, 3).map((seed) => ({
    ...seed,
    quality_status: 'rejected' as const,
    aesthetic_scores: undefined,
    total_score: undefined,
    quality_info: { blur_score: 0.11, threshold: 0.3, reason: '严重失焦' }
  })),
  ...REJECTED_SEEDS
]

export function buildResult(
  taskId: string,
  scenario: DemoScenario,
  enableCrop: boolean,
  preferenceTriggered: boolean
): SelectionResult {
  const baseSeeds = scenario === 'high' ? HIGH_SCORE_SEEDS : PASSED_SEEDS
  const source = enableCrop ? baseSeeds : baseSeeds.filter((s) => s.candidate_type === 'original')

  if (scenario === 'all_poor') {
    return {
      task_id: taskId,
      status: 'all_poor',
      best_candidate_id: null,
      explanation: null,
      candidates: withRank(ALL_POOR_SEEDS),
      preference_skipped: true
    }
  }

  const candidates = withRank([...source, ...REJECTED_SEEDS])
  const best = candidates.find((c) => c.quality_status === 'passed')

  const explanation =
    scenario === 'high'
      ? `该照片在综合评分上明显领先（${pct(best?.total_score)}），构图与主体表现均衡，画面信息完整。`
      : `该照片与第二名评分接近（${pct(best?.total_score)}），经偏好比较后确定为最优结果：构图更集中，主体位置更符合视觉习惯。`

  return {
    task_id: taskId,
    status: 'completed',
    best_candidate_id: best?.candidate_id ?? null,
    explanation,
    explanation_points:
      scenario === 'high'
        ? ['综合评分领先第二名 6.3 分', '构图与主体表现均衡', '画面噪点与曝光控制良好']
        : ['综合评分 89.1，位列第一', '构图更集中，留白比例更合理', '经偏好比较投票胜出'],
    candidates,
    confidence: scenario === 'high' ? 0.86 : 0.42,
    preference_skipped: !preferenceTriggered
  }
}

export function buildCandidateDetail(
  candidateId: string,
  enableCrop: boolean
): CandidateDetail | null {
  const all = [...PASSED_SEEDS, ...REJECTED_SEEDS]
  const seed = all.find((c) => c.candidate_id === candidateId)
  if (!seed) return null
  const sourceImage = SAMPLE_IMAGES.find((i) => i.image_id === seed.source_image_id)
  return {
    ...seed,
    rank: PASSED_SEEDS.findIndex((c) => c.candidate_id === candidateId) + 1 || undefined,
    source_image: sourceImage,
    source_image_url: sourceImage?.image_url,
    in_preference: enableCrop && ['candidate_001', 'candidate_002', 'candidate_003', 'candidate_004'].includes(candidateId)
  }
}

const pct = (v?: number) => (v === undefined ? '—' : (v * 100).toFixed(1))

/** 处理阶段时间线（毫秒），Mock 用 */
export interface TimelineStep {
  status: TaskStatus
  stage: string
  progress: number
  until: number
}

export function buildTimeline(
  scenario: DemoScenario,
  enableCrop: boolean,
  preferenceTriggered: boolean
): TimelineStep[] {
  const steps: TimelineStep[] = [{ status: 'pending', stage: '任务排队中', progress: 3, until: 700 }]
  let cursor = 700

  const push = (status: TaskStatus, stage: string, progress: number, duration: number) => {
    cursor += duration
    steps.push({ status, stage, progress, until: cursor })
  }

  if (enableCrop) push('cropping', '候选图片生成：计算取景框，生成裁剪候选', 16, 1400)
  push('preprocessing', '图片预处理：去重、方向校正、格式统一', 30, 1600)
  push('quality', '图片质量筛查：曝光、模糊、重复检测', 46, 1500)

  if (scenario === 'all_poor') {
    steps.push({
      status: 'all_poor',
      stage: '全部候选未通过质量筛查',
      progress: 50,
      until: cursor + 900
    })
    return steps
  }

  push('scoring', '美学评分：候选图片打分与排序', 62, 1700)
  push('confidence', '置信度评估：判断排序是否可靠', 74, 1300)

  if (scenario === 'failed') {
    steps.push({ status: 'failed', stage: '结果解释模型调用失败', progress: 76, until: cursor + 800 })
    return steps
  }

  // 条件执行：只有置信度不足时才进入偏好比较
  if (preferenceTriggered) push('preference', '偏好比较：候选图片两两比较', 88, 1700)
  push('explaining', '结果解释：生成推荐理由', 96, 1200)
  push('completed', '处理完成', 100, 400)
  return steps
}
