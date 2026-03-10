'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, Phone, Video, MoreVertical } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { useMessages } from '@/lib/hooks/useMessages'
import { useRealtimeMessages } from '@/lib/hooks/useRealtimeMessages'
import { createClient } from '@/lib/supabase/client'
import { uploadFile, getAttachmentType } from '@/lib/utils/uploadFile'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useCallContext } from './GlobalCallProvider'

export function ConversationView({ conversationId, currentUser, otherProfile, nickname }) {
  const { messages, loading, addMessage } = useMessages(conversationId, currentUser?.id)
  const messagesEndRef = useRef(null)
  const containerRef = useRef(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [sendingIds, setSendingIds] = useState(new Set())
  const { initiateCall } = useCallContext() || {}
  const supabase = createClient()
  const router = useRouter()

  useRealtimeMessages(conversationId, (newMsg) => {
    addMessage(newMsg)
    // Auto-mark as read if it's from the other user
    if (newMsg.sender_id !== currentUser?.id) {
      supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', newMsg.id)
        .then(() => {})
    }
  })

  // Auto scroll to bottom when new message arrives (always scroll for own messages)
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    const isOwn = lastMsg?.sender_id === currentUser?.id
    if (!showScrollBtn || isOwn) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Initial scroll without smooth
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()
  }, [conversationId])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    setShowScrollBtn(distFromBottom > 200)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollBtn(false)
  }

  const handleSend = async (text, file) => {
    if (!currentUser?.id) return

    const tempId = `temp-${crypto.randomUUID()}`
    let attachmentUrl = null
    let attachmentType = null

    if (file) {
      attachmentType = getAttachmentType(file)
      attachmentUrl = await uploadFile(file, conversationId, tempId)
      if (!attachmentUrl) return
    }

    // --- OPTIMISTIC UPDATE ---
    const optimisticMsg = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: text || null,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      created_at: new Date().toISOString(),
      read_at: null,
      sender: {
        id: currentUser.id,
        full_name: currentUser.full_name,
        avatar_url: currentUser.avatar_url,
      },
      _optimistic: true,
    }
    addMessage(optimisticMsg)
    setSendingIds(prev => new Set(prev).add(tempId))

    const { data: msg, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: text || null,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      })
      .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`)
      .single()

    if (error) {
      toast.error(`Failed to send: ${error.message || 'Unknown error'}`)
      // Remove the failed optimistic message
      setSendingIds(prev => { const s = new Set(prev); s.delete(tempId); return s })
    } else {
      addMessage(msg)
      setSendingIds(prev => { const s = new Set(prev); s.delete(tempId); return s })
    }
  }

  const displayName = nickname || otherProfile?.full_name || otherProfile?.email || 'User'

  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: 'var(--chat-bg, #f0f4f8)' }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-gray-100 shadow-sm">
        <button
          onClick={() => router.push('/chat')}
          className="lg:hidden p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg mr-1 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          <Avatar src={otherProfile?.avatar_url} name={displayName} size="sm" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-gray-900 truncate">{displayName}</h2>
          <AnimatePresence mode="wait">
            {isTyping ? (
              <motion.p
                key="typing"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-xs text-blue-500 font-medium"
              >
                typing...
              </motion.p>
            ) : (
              <motion.p
                key="online"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="text-xs text-emerald-500 font-medium"
              >
                Online
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => initiateCall?.(otherProfile?.id, 'audio', otherProfile)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
            title="Voice call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => initiateCall?.(otherProfile?.id, 'video', otherProfile)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
            title="Video call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>


      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
        style={{
          backgroundImage: `radial-gradient(circle at 20px 20px, rgba(99,102,241,0.03) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
            <p className="text-sm text-gray-400">Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-3"
          >
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-3xl">
              👋
            </div>
            <p className="text-sm text-gray-500 font-medium">No messages yet</p>
            <p className="text-xs text-gray-400">Say hello to {displayName}!</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const prevMsg = i > 0 ? messages[i - 1] : null
              const nextMsg = messages[i + 1]
              const showAvatar = !nextMsg || nextMsg.sender_id !== msg.sender_id
              const isSending = sendingIds.has(msg.id)
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === currentUser?.id}
                  showAvatar={showAvatar}
                  prevMessage={prevMsg}
                  isSending={isSending}
                />
              )
            })}
          </AnimatePresence>
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="flex items-end gap-2 mb-1"
            >
              <div className="w-8 shrink-0">
                <Avatar src={otherProfile?.avatar_url} name={displayName} size="xs" />
              </div>
              <div className="px-4 py-3 bg-white rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-400 block"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <div className="relative">
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 p-2.5 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
            >
              <ChevronDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} disabled={!currentUser} />
    </div>
  )
}
