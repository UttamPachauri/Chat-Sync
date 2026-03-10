'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Video, PhoneOff, Mic, MicOff, Volume2, VolumeX, X } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

export function CallModal({ isOpen, type, callerName, callerAvatar, isConnected = false, onClose }) {
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callState, setCallState] = useState('ringing')

  // When callee accepts, transition to connected
  useEffect(() => {
    if (isConnected) setCallState('connected')
  }, [isConnected])

  useEffect(() => {
    if (!isOpen) {
      setCallState('ringing')
      setCallDuration(0)
      setIsMuted(false)
      setIsSpeakerOff(false)
    }
  }, [isOpen])

  // Duration counter
  useEffect(() => {
    if (callState !== 'connected') return
    const interval = setInterval(() => setCallDuration(d => d + 1), 1000)
    return () => clearInterval(interval)
  }, [callState])

  const formatDuration = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handleEnd = () => {
    setCallState('ended')
    setTimeout(onClose, 1000)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(0,0,0,0.7)' }}
        >
          <motion.div
            initial={{ scale: 0.85, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 40 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="relative flex flex-col items-center gap-6 px-10 py-10 rounded-3xl shadow-2xl w-80"
            style={{
              background: 'linear-gradient(135deg, #1e2035 0%, #12151f 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Close (minimize) */}
            <button
              onClick={handleEnd}
              className="absolute top-4 right-4 p-1.5 text-white/40 hover:text-white/70 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Call type label */}
            <p className="text-xs text-white/50 font-medium uppercase tracking-widest flex items-center gap-1.5">
              {type === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
              {type === 'video' ? 'Video' : 'Voice'} Call
            </p>

            {/* Avatar with pulse ring */}
            <div className="relative">
              {callState === 'ringing' && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.4)' }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.6, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'rgba(99,102,241,0.2)' }}
                  />
                </>
              )}
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/10 relative z-10 shadow-lg">
                <Avatar src={callerAvatar} name={callerName} size="lg" />
              </div>
              {callState === 'connected' && (
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#12151f] z-20" />
              )}
            </div>

            {/* Name & status */}
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">{callerName}</h3>
              <AnimatePresence mode="wait">
                {callState === 'ringing' && (
                  <motion.p key="ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-white/50 mt-1">
                    Calling…
                  </motion.p>
                )}
                {callState === 'connected' && (
                  <motion.p key="dur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm text-emerald-400 font-mono mt-1">
                    {formatDuration(callDuration)}
                  </motion.p>
                )}
                {callState === 'ended' && (
                  <motion.p key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-red-400 mt-1">
                    Call ended
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMuted(m => !m)}
                className={`p-3.5 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End call */}
              <button
                onClick={handleEnd}
                className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                title="End call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSpeakerOff(s => !s)}
                className={`p-3.5 rounded-full transition-all ${isSpeakerOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                title={isSpeakerOff ? 'Unmute speaker' : 'Mute speaker'}
              >
                {isSpeakerOff ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>

            {/* Note */}
            {callState === 'ringing' && (
              <p className="text-[10px] text-white/25 text-center">
                Voice &amp; video calls coming soon · UI preview
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
