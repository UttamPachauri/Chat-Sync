import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function uploadFile(file, conversationId, messageId) {
  if (file.size > MAX_FILE_SIZE) {
    toast.error('File size must be less than 50MB')
    return null
  }

  const supabase = createClient()
  const fileExt = file.name.split('.').pop().toLowerCase()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `${conversationId}/${messageId}/${Date.now()}_${safeName}`

  const toastId = toast.loading('Uploading…')

  try {
    const { data, error } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (error) {
      toast.error(`Upload failed: ${error.message}`, { id: toastId })
      console.error('[uploadFile] Supabase storage error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(data.path)

    toast.success('File uploaded!', { id: toastId })
    return publicUrl
  } catch (err) {
    toast.error(`Upload failed: ${err.message}`, { id: toastId })
    console.error('[uploadFile] Unexpected error:', err)
    return null
  }
}

export function getAttachmentType(file) {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}
