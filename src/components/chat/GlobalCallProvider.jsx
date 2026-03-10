'use client'

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { IncomingCallModal } from '@/components/chat/IncomingCallModal'
import { CallModal } from '@/components/chat/CallModal'
import { VideoCallModal } from '@/components/chat/VideoCallModal'
import toast from 'react-hot-toast'

const CallContext = createContext(null)
export function useCallContext() { return useContext(CallContext) }

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export function GlobalCallProvider({ children }) {
  const supabase = createClient()

  // Read session once — no extra auth listener, avoids conflicting with page-level useUser()
  const [userId,  setUserId]  = useState(null)
  const [profile, setProfile] = useState(null)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) {
        supabase.from('profiles').select('*').eq('id', uid).single()
          .then(({ data }) => setProfile(data ?? null))
      }
    })
  }, [])

  // ── Refs for stable access inside async closures ──────────────────────────
  const channelRef    = useRef(null)
  const pcRef         = useRef(null)
  const localStreamRef = useRef(null)
  const pendingICE    = useRef([])
  const currentCall   = useRef(null)  // { callId, callerId, calleeId, callType }
  const userIdRef     = useRef(null)
  const incomingRef   = useRef(null)  // latest incomingCall for closures
  const activeTypeRef = useRef(null)  // latest activeCall.callType for closures

  // stable broadcast fn — uses channelRef so never stale
  const broadcast = useCallback(async (event, payload) => {
    if (!channelRef.current) { console.warn('[call] channel not ready'); return }
    const r = await channelRef.current.send({ type: 'broadcast', event, payload })
    console.log('[call] sent', event, r)
  }, [])

  // ── React state for UI only ───────────────────────────────────────────────
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall,   setActiveCall]   = useState(null)
  const [callConnected, setCallConnected] = useState(false)
  const [localStream,  setLocalStream]  = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)

  // keep refs in sync with state
  useEffect(() => { incomingRef.current  = incomingCall }, [incomingCall])
  useEffect(() => { activeTypeRef.current = activeCall?.callType }, [activeCall])
  useEffect(() => { userIdRef.current    = userId }, [userId])

  // ── Core WebRTC helpers (stable – use refs, not state) ────────────────────
  const getMedia = useCallback(async (callType) => {
    try {
      return await navigator.mediaDevices.getUserMedia(
        callType === 'video'
          ? { audio: true, video: { width: 1280, height: 720, facingMode: 'user' } }
          : { audio: true, video: false }
      )
    } catch (err) {
      toast.error('Camera/mic access denied: ' + err.message)
      return null
    }
  }, [])

  // hangup: defined once with refs only → no stale closures
  const hangup = useCallback(async (notify = false) => {
    const meta = currentCall.current
    if (notify && meta) await broadcast('call:ended', meta)
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    pendingICE.current = []
    currentCall.current = null
    setActiveCall(null)
    setIncomingCall(null)
    setCallConnected(false)
  }, [broadcast])   // broadcast is stable → hangup is stable

  const drainICE = useCallback(async () => {
    const pc = pcRef.current
    if (!pc?.remoteDescription) return
    for (const c of pendingICE.current) {
      await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
    }
    pendingICE.current = []
  }, [])

  const createPC = useCallback((meta) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    currentCall.current = meta

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) broadcast('call:ice-candidate', {
        ...meta, from: userIdRef.current, candidate: candidate.toJSON()
      })
    }
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setCallConnected(true)
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) hangup()
    }
    pc.ontrack = (e) => setRemoteStream(e.streams[0])

    pcRef.current = pc
    return pc
  }, [broadcast, hangup])

  // ── Supabase Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    const uid = userId

    channelRef.current = supabase
      .channel('global-calls', { config: { broadcast: { self: false } } })

      // 1. Callee receives ring
      .on('broadcast', { event: 'call:incoming' }, ({ payload }) => {
        if (payload.calleeId === uid) setIncomingCall(payload)
      })

      // 2. Caller receives accept → get media → send offer
      .on('broadcast', { event: 'call:accepted' }, async ({ payload }) => {
        if (payload.callerId !== uid) return
        toast('Connecting call…', { icon: '📞' })

        const callType = activeTypeRef.current ?? 'audio'
        const stream = await getMedia(callType)
        if (!stream) return
        localStreamRef.current = stream
        setLocalStream(stream)

        const meta = {
          callId: payload.callId,
          callerId: payload.callerId,
          calleeId: payload.calleeId,
          callType,
        }
        const pc = createPC(meta)
        stream.getTracks().forEach(t => pc.addTrack(t, stream))

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)
        await broadcast('call:offer', { ...meta, sdp: offer.toJSON() })
      })

      // 3. Callee receives offer → answer
      .on('broadcast', { event: 'call:offer' }, async ({ payload }) => {
        if (payload.calleeId !== uid) return

        const stream = await getMedia(payload.callType)
        if (!stream) { hangup(true); return }
        localStreamRef.current = stream
        setLocalStream(stream)

        const meta = {
          callId: payload.callId,
          callerId: payload.callerId,
          calleeId: payload.calleeId,
          callType: payload.callType,
        }
        const pc = createPC(meta)
        stream.getTracks().forEach(t => pc.addTrack(t, stream))

        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        await drainICE()

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        await broadcast('call:answer', { ...meta, sdp: answer.toJSON() })

        // Show video/audio call UI on callee side
        const inc = incomingRef.current
        setActiveCall({
          callId: meta.callId,
          callType: payload.callType,
          callerName: inc?.callerName,
          callerAvatar: inc?.callerAvatar,
        })
        setIncomingCall(null)
      })

      // 4. Caller receives answer → set remote
      .on('broadcast', { event: 'call:answer' }, async ({ payload }) => {
        if (payload.callerId !== uid) return
        const pc = pcRef.current
        if (!pc) return
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        await drainICE()
      })

      // 5. ICE candidates
      .on('broadcast', { event: 'call:ice-candidate' }, async ({ payload }) => {
        const meta = currentCall.current
        if (!meta || payload.from === uid || payload.callId !== meta.callId) return
        const pc = pcRef.current
        if (!pc) return
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {})
        } else {
          pendingICE.current.push(payload.candidate)
        }
      })

      // 6. Call ended by other side
      .on('broadcast', { event: 'call:ended' }, ({ payload }) => {
        const meta = currentCall.current
        if (!meta || payload.callId !== meta.callId) return
        hangup()
        toast('Call ended', { icon: '📞' })
      })

      .subscribe((status) => {
        console.log('[call] channel status:', status)
      })

    return () => { supabase.removeChannel(channelRef.current) }
  }, [userId, getMedia, createPC, drainICE, hangup, broadcast])

  // ── initiateCall — exposed via Context ───────────────────────────────────
  const initiateCall = useCallback(async (calleeId, callType, calleeProfile) => {
    if (!userId) return
    const callId = crypto.randomUUID()
    const payload = {
      callId, callType,
      callerId: userId,
      calleeId,
      callerName: profile?.full_name || profile?.email || 'Someone',
      callerAvatar: profile?.avatar_url || null,
    }
    setActiveCall({
      callId, callType,
      callerName: calleeProfile?.full_name || calleeProfile?.email || 'User',
      callerAvatar: calleeProfile?.avatar_url || null,
    })
    activeTypeRef.current = callType
    setCallConnected(false)
    await broadcast('call:incoming', payload)
  }, [userId, profile, broadcast])

  // ── Callee accept / decline ───────────────────────────────────────────────
  const handleAccept = useCallback(async () => {
    const inc = incomingRef.current
    if (!inc) return
    // Show the call UI on callee while waiting for offer
    setActiveCall({
      callId: inc.callId,
      callType: inc.callType,
      callerName: inc.callerName,
      callerAvatar: inc.callerAvatar,
    })
    await broadcast('call:accepted', {
      callId: inc.callId,
      callerId: inc.callerId,
      calleeId: userIdRef.current,
      callType: inc.callType,
    })
    setIncomingCall(null)
  }, [broadcast])

  const handleDecline = useCallback(async () => {
    const inc = incomingRef.current
    if (!inc) return
    await broadcast('call:declined', {
      callId: inc.callId,
      callerId: inc.callerId,
      calleeId: userIdRef.current,
    })
    setIncomingCall(null)
  }, [broadcast])

  const isVideo = activeCall?.callType === 'video'

  return (
    <CallContext.Provider value={{ initiateCall }}>
      {children}

      <IncomingCallModal call={incomingCall} onAccept={handleAccept} onDecline={handleDecline} />

      {!isVideo && (
        <CallModal
          isOpen={!!activeCall}
          type={activeCall?.callType}
          callerName={activeCall?.callerName}
          callerAvatar={activeCall?.callerAvatar}
          isConnected={callConnected}
          onClose={() => hangup(true)}
        />
      )}

      {isVideo && (
        <VideoCallModal
          isOpen={!!activeCall}
          localStream={localStream}
          remoteStream={remoteStream}
          callerName={activeCall?.callerName}
          isConnected={callConnected}
          onClose={() => hangup(true)}
        />
      )}
    </CallContext.Provider>
  )
}
