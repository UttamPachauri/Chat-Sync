'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeMessages(conversationId, onNewMessage) {
  const supabase = createClient()
  const channelRef = useRef(null)

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
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [conversationId])
}
