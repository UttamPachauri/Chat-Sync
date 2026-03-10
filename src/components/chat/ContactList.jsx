'use client'

import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { NicknameEditor } from './NicknameEditor'
import { formatConversationDate } from '@/lib/utils/formatDate'
import { motion, AnimatePresence } from 'framer-motion'

export function ContactList({ conversations, currentConversationId, currentUserId, onNicknameUpdate }) {
  const router = useRouter()

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-gray-400 text-center leading-relaxed">
          No conversations yet.<br />Add a friend to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <AnimatePresence>
        {conversations.map((conv, i) => {
          const isActive = conv.id === currentConversationId
          const other = conv.otherProfile
          const displayName = conv.nickname || other?.full_name || other?.email || 'Unknown'
          const lastMsg = conv.lastMessage
          let previewText = lastMsg?.content || ''
          if (!previewText && lastMsg?.attachment_type) {
            previewText = lastMsg.attachment_type === 'image' ? '📷 Image' :
              lastMsg.attachment_type === 'video' ? '🎥 Video' : '📎 File'
          }
          const isOwn = lastMsg?.sender_id === currentUserId

          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => router.push(`/chat/${conv.id}`)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2 ${
                isActive
                  ? 'bg-blue-50 border-blue-500'
                  : 'border-transparent hover:bg-gray-50'
              }`}
            >
              <Avatar src={other?.avatar_url} name={displayName} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <NicknameEditor
                    currentNickname={conv.nickname}
                    fallbackName={other?.full_name || other?.email}
                    onSave={(nickname) => onNicknameUpdate(other?.id, nickname)}
                  />
                  {lastMsg && (
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {formatConversationDate(lastMsg.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-xs text-gray-500 truncate flex-1">
                    {isOwn && previewText ? <span className="text-gray-400">You: </span> : null}
                    {previewText || <span className="italic">New conversation</span>}
                  </p>
                  <Badge count={conv.unreadCount} className="ml-2" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
