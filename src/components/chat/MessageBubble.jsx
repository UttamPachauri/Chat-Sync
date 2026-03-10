'use client'

import { formatMessageTime, formatDateDivider, isSameDay } from '@/lib/utils/formatDate'
import { Avatar } from '@/components/ui/Avatar'
import { Download, FileText, Check, Clock } from 'lucide-react'
import { motion } from 'framer-motion'

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  )
}

function MessageStatus({ isSending, isOwn, readAt }) {
  if (!isOwn) return null
  return (
    <span className="flex items-center gap-0.5 mt-0.5 px-1">
      {isSending ? (
        <Clock className="w-3 h-3 text-gray-300" />
      ) : readAt ? (
        <>
          <Check className="w-3 h-3 text-blue-400 -mr-2" />
          <Check className="w-3 h-3 text-blue-400" />
        </>
      ) : (
        <Check className="w-3 h-3 text-gray-400" />
      )}
    </span>
  )
}

export function MessageBubble({ message, isOwn, showAvatar, prevMessage, isSending }) {
  const showDivider = !prevMessage || !isSameDay(prevMessage.created_at, message.created_at)
  const dividerLabel = showDivider ? formatDateDivider(message.created_at) : null

  const renderAttachment = () => {
    if (!message.attachment_url) return null
    if (message.attachment_type === 'image') {
      return (
        <a href={message.attachment_url} target="_blank" rel="noopener noreferrer" className="block mt-1">
          <img
            src={message.attachment_url}
            alt="attachment"
            className="rounded-xl max-w-[220px] max-h-[220px] object-cover cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
          />
        </a>
      )
    }
    if (message.attachment_type === 'video') {
      return (
        <video
          src={message.attachment_url}
          controls
          className="rounded-xl max-w-[250px] mt-1 shadow-sm"
        />
      )
    }
    const fileName = message.attachment_url.split('/').pop()
    return (
      <a
        href={message.attachment_url}
        download
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-1 px-3 py-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors text-sm"
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span className="truncate max-w-[160px]">{decodeURIComponent(fileName)}</span>
        <Download className="w-3.5 h-3.5 shrink-0 ml-auto" />
      </a>
    )
  }

  return (
    <>
      {showDivider && <DateDivider label={dividerLabel} />}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: isSending ? 0.7 : 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className={`flex items-end gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar (only for received messages) */}
        {!isOwn && (
          <div className="w-8 shrink-0">
            {showAvatar && (
              <Avatar
                src={message.sender?.avatar_url}
                name={message.sender?.full_name || 'User'}
                size="xs"
              />
            )}
          </div>
        )}

        <div className={`max-w-[65%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
          <div
            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
              isOwn
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm'
                : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
            }`}
          >
            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
            {renderAttachment()}
          </div>
          <div className={`flex items-center gap-0.5 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
              {formatMessageTime(message.created_at)}
            </span>
            <MessageStatus isSending={isSending} isOwn={isOwn} readAt={message.read_at} />
          </div>
        </div>
      </motion.div>
    </>
  )
}
