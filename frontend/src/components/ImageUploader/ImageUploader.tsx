import { DeleteOutlined, InboxOutlined } from '@ant-design/icons'
import { App, Button, Empty, Popconfirm, Tag, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { ACCEPT_EXT, MAX_PHOTOS, validateFiles, type LocalPhoto } from '@/utils/image'
import { formatFileSize } from '@/utils/format'

interface Props {
  photos: LocalPhoto[]
  onAdd: (files: File[]) => Promise<void> | void
  onRemove: (uid: string) => void
  onClear: () => void
}

export default function ImageUploader({ photos, onAdd, onRemove, onClear }: Props) {
  const { message } = App.useApp()

  const handleFiles = (files: File[]) => {
    const { accepted, rejected } = validateFiles(files)
    rejected.forEach((item) => message.warning(`${item.name}：${item.reason}`))

    const room = MAX_PHOTOS - photos.length
    if (accepted.length > room) {
      message.warning(`最多上传 ${MAX_PHOTOS} 张，本次仅添加前 ${Math.max(room, 0)} 张`)
    }
    const finalFiles = accepted.slice(0, Math.max(room, 0))
    if (finalFiles.length) void onAdd(finalFiles)
  }

  const uploadProps: UploadProps = {
    multiple: true,
    accept: ACCEPT_EXT,
    showUploadList: false,
    beforeUpload: (file) => {
      handleFiles([file])
      return Upload.LIST_IGNORE
    }
  }

  return (
    <div>
      <Upload.Dragger {...uploadProps} style={{ padding: '10px 0' }}>
        <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或将照片拖拽到此区域</p>
        <p className="ant-upload-hint">
          支持批量上传，格式 JPG / JPEG / PNG / WebP，单张不超过 20MB
        </p>
      </Upload.Dragger>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '14px 0 10px'
        }}
      >
        <div style={{ fontSize: 13 }}>
          已选照片 <b>{photos.length}</b> 张
          {photos.length > 0 && (
            <span className="muted" style={{ marginLeft: 8 }}>
              建议至少 2 张、最多 {MAX_PHOTOS} 张
            </span>
          )}
        </div>
        {photos.length > 0 && (
          <Popconfirm title="确定清空全部照片？" onConfirm={onClear} okText="清空" cancelText="取消">
            <Button size="small" type="text" danger>
              清空全部
            </Button>
          </Popconfirm>
        )}
      </div>

      {photos.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="还没有添加照片"
          style={{ padding: '18px 0' }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
            gap: 10
          }}
        >
          {photos.map((photo) => (
            <div key={photo.uid} className="photo-card">
              <div className="photo-thumb">
                <img src={photo.url} alt={photo.name} />
                <Tag
                  className="photo-badge right"
                  style={{ border: 'none', margin: 0 }}
                  color="rgba(17,24,39,0.62)"
                >
                  {photo.width}×{photo.height}
                </Tag>
                <Button
                  size="small"
                  shape="circle"
                  icon={<DeleteOutlined />}
                  style={{ position: 'absolute', bottom: 6, right: 6 }}
                  onClick={() => onRemove(photo.uid)}
                />
              </div>
              <div className="photo-meta" style={{ padding: '6px 8px 8px' }}>
                <div
                  style={{
                    fontSize: 11.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={photo.name}
                >
                  {photo.name}
                </div>
                <div className="muted" style={{ fontSize: 11 }}>
                  {formatFileSize(photo.size)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
