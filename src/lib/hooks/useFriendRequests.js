'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export function useFriendRequests(userId) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('friend_requests')
        .select(`
          *,
          sender:profiles!friend_requests_sender_id_fkey(id, full_name, email, avatar_url),
          receiver:profiles!friend_requests_receiver_id_fkey(id, full_name, email, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (!error) setRequests(data || [])
      setLoading(false)
    }

    fetchRequests()

    // Real-time subscription for incoming requests
    const channel = supabase
      .channel('friend-requests-' + userId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friend_requests',
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('friend_requests')
              .select(`
                *,
                sender:profiles!friend_requests_sender_id_fkey(id, full_name, email, avatar_url),
                receiver:profiles!friend_requests_receiver_id_fkey(id, full_name, email, avatar_url)
              `)
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setRequests(prev => [data, ...prev])
              toast('New friend request from ' + data.sender?.full_name, { icon: '👋' })
            }
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(r => r.id === payload.new.id ? { ...r, status: payload.new.status } : r)
            )
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const sendRequest = async (receiverEmail) => {
    try {
      const { data: receiverProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', receiverEmail)
        .maybeSingle()  // returns null (not an error) when no row found

      if (profileError || !receiverProfile) {
        toast.error('User not found with that email')
        return { error: 'User not found' }
      }

      if (receiverProfile.id === userId) {
        toast.error('You cannot add yourself')
        return { error: 'Self-add not allowed' }
      }

      // Check both directions of an existing request with two simple queries
      const { data: req1 } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('sender_id', userId)
        .eq('receiver_id', receiverProfile.id)
        .maybeSingle()

      const { data: req2 } = await supabase
        .from('friend_requests')
        .select('id, status')
        .eq('sender_id', receiverProfile.id)
        .eq('receiver_id', userId)
        .maybeSingle()

      const existing = req1 || req2

      if (existing) {
        toast.error(existing.status === 'accepted' ? 'Already friends!' : 'Request already sent')
        return { error: 'Already exists' }
      }

      const { error } = await supabase
        .from('friend_requests')
        .insert({ sender_id: userId, receiver_id: receiverProfile.id })

      if (error) {
        toast.error('Failed to send request: ' + error.message)
        return { error }
      }

      toast.success('Friend request sent to ' + receiverProfile.full_name)
      return { success: true }
    } catch (err) {
      toast.error('Unexpected error sending request')
      return { error: err }
    }
  }

  const respondToRequest = async (requestId, status, senderId) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status })
      .eq('id', requestId)

    if (error) {
      toast.error('Failed to update request')
      return
    }

    if (status === 'accepted') {
      await supabase.from('contacts').insert([
        { owner_id: userId, contact_id: senderId },
        { owner_id: senderId, contact_id: userId },
      ])

      const [p1, p2] = [userId, senderId].sort()
      await supabase.from('conversations').insert({
        participant_1: p1,
        participant_2: p2,
      })

      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r))
      toast.success('Friend request accepted!')
    } else {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r))
      toast('Request declined')
    }
  }

  const incomingRequests = requests.filter(r => r.receiver_id === userId && r.status === 'pending')
  const sentRequests = requests.filter(r => r.sender_id === userId)
  const friends = requests.filter(r => r.status === 'accepted')

  return { requests, incomingRequests, sentRequests, friends, loading, sendRequest, respondToRequest }
}
