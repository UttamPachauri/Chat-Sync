'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Uses a single shared 'calls' Realtime channel that EVERYONE subscribes to.
 * Messages are filtered client-side by calleeId / callerId so each user only
 * acts on signals meant for them.
 *
 * Payload shape for all events:
 * { callId, callType, callerId, calleeId, callerName, callerAvatar, conversationId }
 */
export function useCallSignaling({ currentUserId, onIncoming, onAccepted, onDeclined, onEnded }) {
  const supabase = createClient()
  const channelRef = useRef(null)

  useEffect(() => {
    if (!currentUserId) return

    // Single shared channel — everyone subscribes, filter by IDs client-side
    channelRef.current = supabase
      .channel('calls', { config: { broadcast: { self: false } } })
      .on('broadcast', { event: 'call:incoming' }, ({ payload }) => {
        if (payload.calleeId === currentUserId) onIncoming?.(payload)
      })
      .on('broadcast', { event: 'call:accepted' }, ({ payload }) => {
        if (payload.callerId === currentUserId) onAccepted?.(payload)
      })
      .on('broadcast', { event: 'call:declined' }, ({ payload }) => {
        if (payload.callerId === currentUserId) onDeclined?.(payload)
      })
      .on('broadcast', { event: 'call:ended' }, ({ payload }) => {
        // Both sides should react if this call involves them
        if (payload.callerId === currentUserId || payload.calleeId === currentUserId) {
          onEnded?.(payload)
        }
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [currentUserId])

  const broadcast = async (event, payload) => {
    if (!channelRef.current) return
    await channelRef.current.send({ type: 'broadcast', event, payload })
  }

  /** Caller → Callee: you have an incoming call */
  const sendCallIncoming = (calleeId, payload) =>
    broadcast('call:incoming', { ...payload, calleeId, callerId: currentUserId })

  /** Callee → Caller: I accepted */
  const sendCallAccepted = (callerId, payload) =>
    broadcast('call:accepted', { ...payload, callerId, calleeId: currentUserId })

  /** Callee → Caller: I declined */
  const sendCallDeclined = (callerId, payload) =>
    broadcast('call:declined', { ...payload, callerId, calleeId: currentUserId })

  /** Either side: call ended */
  const sendCallEnded = (targetId, payload) =>
    broadcast('call:ended', {
      ...payload,
      callerId: payload.callerId ?? currentUserId,
      calleeId: payload.calleeId ?? targetId,
    })

  return { sendCallIncoming, sendCallAccepted, sendCallDeclined, sendCallEnded }
}
