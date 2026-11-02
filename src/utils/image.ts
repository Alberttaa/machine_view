/** 本地图片校验与预览工具（纯前端能力，不涉及算法） */

export const ACCEPT_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const ACCEPT_EXT = '.jpg,.jpeg,.png,.webp'
export const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
export const MIN_PHOTOS = 2
export const MAX_PHOTOS = 30

export interface LocalPhoto {
  uid: string
  file: File
  url: string
  name: string
  size: number
  width: number
  height: number
}

export interface RejectedFile {
  name: string
  reason: string
}

export function validateFiles(files: File[]): { accepted: File[]; rejected: RejectedFile[] } {
  const accepted: File[] = []
  const rejected: RejectedFile[] = []

  files.forEach((file) => {
    const typeOk =
      ACCEPT_MIME.includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name)
    if (!typeOk) {
      rejected.push({ name: file.name, reason: '格式不支持，仅接受 JPG / PNG / WebP' })
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      rejected.push({ name: file.name, reason: `超过 ${MAX_FILE_SIZE / 1024 / 1024}MB 上限` })
      return
    }
    accepted.push(file)
  })

  return { accepted, rejected }
}

/** 读取图片真实尺寸，用于上传列表展示与后端校验 */
export function loadImageSize(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = url
  })
}

export async function toLocalPhoto(file: File): Promise<LocalPhoto> {
  const url = URL.createObjectURL(file)
  const { width, height } = await loadImageSize(url)
  return {
    uid: `${file.name}-${file.size}-${file.lastModified}`,
    file,
    url,
    name: file.name,
    size: file.size,
    width,
    height
  }
}
