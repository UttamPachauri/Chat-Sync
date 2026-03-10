'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function useContacts(userId) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchContacts = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('contacts')
      .select(`
        *,
        contact:profiles!contacts_contact_id_fkey(id, full_name, email, avatar_url)
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })

    if (!error) setContacts(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchContacts()

    if (!userId) return

    // Realtime: re-fetch whenever a new contact is added (e.g. after accepting friend request)
    const channel = supabase
      .channel('contacts-' + userId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contacts',
          filter: `owner_id=eq.${userId}`,
        },
        () => {
          fetchContacts()
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId, fetchContacts])

  const updateNickname = async (contactId, nickname) => {
    const { error } = await supabase
      .from('contacts')
      .update({ nickname: nickname.trim() || null })
      .eq('owner_id', userId)
      .eq('contact_id', contactId)

    if (error) {
      toast.error('Failed to update nickname')
      return false
    }

    setContacts(prev =>
      prev.map(c => c.contact_id === contactId ? { ...c, nickname: nickname.trim() || null } : c)
    )
    toast.success('Nickname updated!')
    return true
  }

  const getDisplayName = (contactId) => {
    const contact = contacts.find(c => c.contact_id === contactId)
    return contact?.nickname || contact?.contact?.full_name || contact?.contact?.email || 'Unknown'
  }

  return { contacts, loading, updateNickname, getDisplayName, refetch: fetchContacts }
}
