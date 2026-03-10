'use client'

import { X, FileText, Image as ImageIcon, Video } from 'lucide-react'

export function AttachmentPreview({ file, onRemove }) {
  if (!file) return null

  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  const sizeKB = (file.size / 1024).toFixed(1)
  const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
  const sizeLabel = file.size > 1024 * 1024 ? `${sizeMB} MB` : `${sizeKB} KB`

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-t border-blue-100">
      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
        {isImage ? (
          <ImageIcon className="w-5 h-5 text-blue-500" />
        ) : isVideo ? (
          <Video className="w-5 h-5 text-blue-500" />
        ) : (
          <FileText className="w-5 h-5 text-blue-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">{sizeLabel}</p>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
