/** 图片与候选照片数据结构（对应设计文档 7.1 / 7.2） */

export interface ImageInfo {
  image_id: string
  file_name: string
  image_url: string
  width: number
  height: number
  file_size: number
}

export type CandidateType = 'original' | 'crop'

export type QualityStatus = 'passed' | 'rejected'

export interface CandidateInfo {
  candidate_id: string
  /** 关联的原始照片 id，裁剪候选通过它回溯原图 */
  source_image_id: string
  image_url: string
  candidate_type: CandidateType
  /** [x, y, w, h]，仅裁剪候选返回 */
  crop_box?: [number, number, number, number]
  quality_status: QualityStatus
  /** 质量检测原始结果，例如 { blur_score: 0.12 } */
  quality_info?: Record<string, unknown>
  /** 评价维度与分数，维度由后端返回，前端不做假设 */
  aesthetic_scores?: Record<string, number>
  total_score?: number
  rank?: number
}

/** 候选详情：额外带上原始照片信息与对比图 */
export interface CandidateDetail extends CandidateInfo {
  source_image?: ImageInfo
  /** 原图预览地址（裁剪候选用于对比） */
  source_image_url?: string
  /** 是否参与了偏好比较环节 */
  in_preference?: boolean
}
