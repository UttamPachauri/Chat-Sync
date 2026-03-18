'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeMessages(conversationId, currentUserId, onNewMessage, onTypingChange) {
  const supabase = createClient()
  const channelRef = useRef(null)
  const typingTimerRef = useRef(null)

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !currentUserId) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender_id: currentUserId },
    })
  }, [currentUserId])

  useEffect(() => {
    if (!conversationId) return

    channelRef.current = supabase
      .channel('messages-' + conversationId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch full message with sender profile
          const { data } = await supabase
            .from('messages')
            .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`)
            .eq('id', payload.new.id)
            .single()
          if (data) onNewMessage(data)
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload?.sender_id || payload.sender_id === currentUserId) return
        onTypingChange?.(true)
        clearTimeout(typingTimerRef.current)
        typingTimerRef.current = setTimeout(() => onTypingChange?.(false), 3000)
      })
      .subscribe()

    return () => {
      clearTimeout(typingTimerRef.current)
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [conversationId])

  return { sendTyping }
}
