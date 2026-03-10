'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      {/* Left side — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">ChatSync</span>
          </Link>
          {children}
        </motion.div>
      </div>

      {/* Right side — gradient */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 30%, #1a56db 60%, #0ea5e9 100%)',
        }}
      >
        {/* Blob decorations */}
        <div className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: '#60a5fa', top: '-10%', right: '-10%' }} />
        <div className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: '#a78bfa', bottom: '10%', left: '-5%' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-20 blur-2xl"
          style={{ background: '#38bdf8', top: '40%', right: '20%' }} />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 mx-auto border border-white/20 shadow-xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3">Welcome to ChatSync</h2>
            <p className="text-white/70 text-lg leading-relaxed max-w-xs mx-auto">
              Connect with friends and colleagues in real-time. Fast, secure, and beautiful.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-4 text-center">
              {[
                { n: '10k+', label: 'Users' },
                { n: '500k+', label: 'Messages' },
                { n: '99.9%', label: 'Uptime' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                  <div className="text-xl font-bold">{stat.n}</div>
                  <div className="text-xs text-white/60 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
