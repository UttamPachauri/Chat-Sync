'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneOff, Mic, MicOff, Camera, CameraOff } from 'lucide-react'

export function VideoCallModal({ isOpen, localStream, remoteStream, callerName, isConnected, onClose }) {
  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)

  const [isMuted,     setIsMuted]     = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [duration,    setDuration]    = useState(0)

  // Helper: attach stream to a video element safely
  const attachStream = (el, stream) => {
    if (!el || !stream) return
    if (el.srcObject !== stream) {
      el.srcObject = stream
      el.play().catch(() => {})
    }
  }

  // ── Callback refs: fire the moment the DOM element exists ─────────────────
  const localRefCallback = useCallback((node) => {
    localVideoRef.current = node
    attachStream(node, localStream)
  }, [localStream]) // eslint-disable-line

  const remoteRefCallback = useCallback((node) => {
    remoteVideoRef.current = node
    attachStream(node, remoteStream)
  }, [remoteStream]) // eslint-disable-line

  // ── Also handle streams arriving AFTER elements are already mounted ────────
  useEffect(() => {
    attachStream(localVideoRef.current, localStream)
  }, [localStream])

  useEffect(() => {
    attachStream(remoteVideoRef.current, remoteStream)
  }, [remoteStream])

  // Reset on close
  useEffect(() => {
    if (!isOpen) { setIsMuted(false); setIsCameraOff(false); setDuration(0) }
  }, [isOpen])

  // Timer
  useEffect(() => {
    if (!isConnected) return
    const id = setInterval(() => setDuration(d => d + 1), 1000)
    return () => clearInterval(id)
  }, [isConnected])

  const fmt = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const toggleMute = () => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(m => !m)
  }
  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsCameraOff(c => !c)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* ── Remote video (main view) ─────────────────────────────────── */}
          <div className="relative flex-1 flex items-center justify-center bg-gray-950 overflow-hidden">

            {/* Remote video is always in the DOM so the ref can receive srcObject */}
            <video
              ref={remoteRefCallback}
              autoPlay
              playsInline
              className={`w-full h-full object-cover transition-opacity duration-300 ${remoteStream ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Placeholder shown while remote video hasn't arrived */}
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-2xl select-none"
                >
                  {callerName?.[0]?.toUpperCase() ?? '?'}
                </motion.div>
                <p className="text-white/50 text-sm">
                  {isConnected ? `${callerName} has no camera` : 'Connecting…'}
                </p>
              </div>
            )}

            {/* Top info bar */}
            <div
              className="absolute top-0 left-0 right-0 px-5 pt-5 pb-8 flex items-start justify-between pointer-events-none"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}
            >
              <div>
                <p className="text-white font-semibold text-base drop-shadow">{callerName}</p>
                <p className="text-white/60 text-sm font-mono">
                  {isConnected ? fmt(duration) : 'Calling…'}
                </p>
              </div>
            </div>

            {/* ── Local PiP (always in DOM so ref works) ─────────────────── */}
            <motion.div
              drag dragMomentum={false}
              className="absolute bottom-5 right-5 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl cursor-grab active:cursor-grabbing"
              style={{ width: 120, height: 90, zIndex: 10 }}
              whileHover={{ scale: 1.03 }}
            >
              {/* Video element always rendered */}
              <video
                ref={localRefCallback}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${localStream && !isCameraOff ? 'opacity-100' : 'opacity-0'}`}
              />
              {/* Overlay when camera is off or no stream */}
              {(!localStream || isCameraOff) && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <CameraOff className="w-5 h-5 text-white/40" />
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Controls bar ─────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-center gap-6 py-6 px-8"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)' }}
          >
            <CtrlBtn
              active={isMuted}
              onClick={toggleMute}
              icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              label={isMuted ? 'Unmute' : 'Mute'}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
            >
              <PhoneOff className="w-7 h-7" />
            </motion.button>
            <CtrlBtn
              active={isCameraOff}
              onClick={toggleCamera}
              icon={isCameraOff ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
              label={isCameraOff ? 'Cam on' : 'Cam off'}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CtrlBtn({ active, onClick, icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        onClick={onClick}
        className={`p-4 rounded-full transition-all ${active ? 'bg-red-500/30 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
      >
        {icon}
      </button>
      <span className="text-white/40 text-xs">{label}</span>
    </div>
  )
}
