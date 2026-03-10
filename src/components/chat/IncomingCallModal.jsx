'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Video, PhoneOff, PhoneIncoming } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

export function IncomingCallModal({ call, onAccept, onDecline }) {
  const [elapsed, setElapsed] = useState(0)

  // Auto-decline after 30s if not answered
  useEffect(() => {
    if (!call) return
    const timeout = setTimeout(() => onDecline?.(), 30000)
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [call])

  useEffect(() => {
    if (call) setElapsed(0)
  }, [call?.callId])

  return (
    <AnimatePresence>
      {call && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.75)' }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="flex flex-col items-center gap-6 px-10 py-10 rounded-3xl shadow-2xl w-80"
            style={{
              background: 'linear-gradient(135deg, #1a1f3a 0%, #0f1220 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Label */}
            <p className="text-xs text-white/50 font-medium uppercase tracking-widest flex items-center gap-1.5">
              {call.callType === 'video'
                ? <Video className="w-3.5 h-3.5" />
                : <PhoneIncoming className="w-3.5 h-3.5" />}
              Incoming {call.callType === 'video' ? 'Video' : 'Voice'} Call
            </p>

            {/* Avatar with pulse rings */}
            <div className="relative flex items-center justify-center">
              {[1, 1.4, 1.8].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [scale, scale + 0.25, scale], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute rounded-full"
                  style={{
                    width: 96, height: 96,
                    background: 'rgba(99,102,241,0.3)',
                  }}
                />
              ))}
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 relative z-10 shadow-lg">
                <Avatar src={call.callerAvatar} name={call.callerName} size="lg" />
              </div>
            </div>

            {/* Name */}
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">{call.callerName}</h3>
              <p className="text-sm text-white/40 mt-1">
                {elapsed < 30 ? `Ringing… (${30 - elapsed}s)` : 'Missed'}
              </p>
            </div>

            {/* Accept / Decline */}
            <div className="flex items-center gap-8">
              {/* Decline */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onDecline}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
                <span className="text-xs text-white/40">Decline</span>
              </div>

              {/* Accept */}
              <div className="flex flex-col items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  onClick={onAccept}
                  className="p-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-colors"
                >
                  {call.callType === 'video' ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
                </motion.button>
                <span className="text-xs text-white/40">Accept</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
