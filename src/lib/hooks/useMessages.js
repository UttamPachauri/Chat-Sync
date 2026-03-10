'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMessages(conversationId, currentUserId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    const { data, error } = await supabase
      .from('messages')
      .select(`*, sender:profiles!messages_sender_id_fkey(id, full_name, avatar_url)`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) {
      setMessages(data || [])
      // Mark messages as read
      if (currentUserId) {
        await supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUserId)
          .is('read_at', null)
      }
    }
    setLoading(false)
  }, [conversationId, currentUserId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const addMessage = useCallback((newMessage) => {
    setMessages(prev => {
      // If message already exists by ID, skip
      if (prev.some(m => m.id === newMessage.id)) return prev

      // If this is a real message (not optimistic), try to replace a matching optimistic temp message
      if (!newMessage._optimistic) {
        const tempIndex = prev.findIndex(
          m =>
            m._optimistic &&
            m.sender_id === newMessage.sender_id &&
            m.content === newMessage.content &&
            m.attachment_url === newMessage.attachment_url
        )
        if (tempIndex !== -1) {
          const updated = [...prev]
          updated[tempIndex] = newMessage
          return updated
        }
      }

      return [...prev, newMessage]
    })
  }, [])

  return { messages, loading, addMessage, refetch: fetchMessages }
}
