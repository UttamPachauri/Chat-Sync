'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

async function enrichConversations(supabase, data, userId) {
  const enriched = await Promise.all(
    (data || []).map(async (conv) => {
      const otherId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1
      const otherProfile = conv.participant_1 === userId ? conv.profile2 : conv.profile1

      const { data: contact } = await supabase
        .from('contacts')
        .select('nickname')
        .eq('owner_id', userId)
        .eq('contact_id', otherId)
        .single()

      const { data: lastMsgArr } = await supabase
        .from('messages')
        .select('content, created_at, sender_id, attachment_type')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)

      const lastMessage = lastMsgArr?.[0] || null

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .neq('sender_id', userId)
        .is('read_at', null)

      return {
        ...conv,
        otherProfile,
        nickname: contact?.nickname,
        lastMessage,
        unreadCount: count || 0,
      }
    })
  )

  enriched.sort((a, b) => {
    const aTime = a.lastMessage?.created_at || a.created_at
    const bTime = b.lastMessage?.created_at || b.created_at
    return new Date(bTime) - new Date(aTime)
  })

  return enriched
}

async function fetchRawConversations(supabase, userId) {
  return supabase
    .from('conversations')
    .select(`
      *,
      profile1:profiles!conversations_participant_1_fkey(id, full_name, email, avatar_url),
      profile2:profiles!conversations_participant_2_fkey(id, full_name, email, avatar_url)
    `)
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('created_at', { ascending: false })
}

export function useConversations(userId) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchConversations = async () => {
      const { data, error } = await fetchRawConversations(supabase, userId)
      if (!error) {
        const enriched = await enrichConversations(supabase, data, userId)
        setConversations(enriched)
      }
      setLoading(false)
    }

    fetchConversations()

    const channel = supabase
      .channel('conversations-realtime-' + userId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          fetchConversations()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
      const enriched = await enrichConversations(supabase, data, userId)
      setConversations(enriched)
    }
    setLoading(false)
  }

  return { conversations, loading, refetch }
}
