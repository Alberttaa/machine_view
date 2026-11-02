import { Image } from 'antd'
import type { CSSProperties } from 'react'

interface Props {
  src?: string
  alt?: string
  style?: CSSProperties
  className?: string
  /** 是否启用点击放大 */
  zoomable?: boolean
}

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#eef0f3"/><text x="160" y="104" font-size="12" fill="#8a919c" text-anchor="middle" font-family="sans-serif">图片加载失败</text></svg>'
  )

/** 统一的大图预览组件：保持原始比例、失败占位、支持点击放大 */
export default function ImagePreview({ src, alt, style, className, zoomable = true }: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      fallback={FALLBACK}
      className={className}
      style={{ objectFit: 'contain', ...style }}
      preview={zoomable ? { mask: '点击放大查看' } : false}
    />
  )
}
