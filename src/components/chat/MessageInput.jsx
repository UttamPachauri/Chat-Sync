'use client'

import { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Send, Paperclip, Smile } from 'lucide-react'
import { AttachmentPreview } from './AttachmentPreview'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_SIZE = 50 * 1024 * 1024
const CHAR_WARN_THRESHOLD = 400
const CHAR_MAX = 2000

const QUICK_EMOJIS = ['😊', '😂', '❤️', '👍', '🙏', '🔥', '😢', '😮']

export function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [sending, setSending] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const textareaRef = useRef(null)

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('File too large (max 50MB) or type not supported')
      return
    }
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getInputProps, open } = useDropzone({
    onDrop,
    maxSize: MAX_SIZE,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  })

  const handleSend = async () => {
    if ((!text.trim() && !file) || sending) return
    setSending(true)
    setShowEmoji(false)
    await onSend(text.trim(), file)
    setText('')
    setFile(null)
    setSending(false)
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px'
    }
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextChange = (e) => {
    const val = e.target.value
    if (val.length > CHAR_MAX) return
    setText(val)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const insertEmoji = (emoji) => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const newText = text.slice(0, start) + emoji + text.slice(end)
    if (newText.length > CHAR_MAX) return
    setText(newText)
    // Restore cursor
    setTimeout(() => {
      el.setSelectionRange(start + emoji.length, start + emoji.length)
      el.focus()
    }, 0)
  }

  const charCount = text.length
  const showCharCounter = charCount >= CHAR_WARN_THRESHOLD
  const charRatio = charCount / CHAR_MAX
  const isNearLimit = charCount >= CHAR_MAX - 50

  return (
    <div className="border-t border-gray-100 bg-white">
      <input {...getInputProps()} />
      <AttachmentPreview file={file} onRemove={() => setFile(null)} />

      {/* Emoji quick-picker */}
      <AnimatePresence>
        {showEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="flex gap-2 px-4 py-2 border-b border-gray-100"
          >
            {QUICK_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => insertEmoji(emoji)}
                className="text-xl hover:scale-125 transition-transform active:scale-95"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 px-4 py-3">
        {/* Attachment */}
        <button
          onClick={open}
          disabled={disabled}
          className="p-2.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all shrink-0 mb-0.5 disabled:opacity-50"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Emoji toggle */}
        <button
          onClick={() => setShowEmoji(v => !v)}
          disabled={disabled}
          className={`p-2.5 rounded-xl transition-all shrink-0 mb-0.5 disabled:opacity-50 ${
            showEmoji
              ? 'text-yellow-500 bg-yellow-50'
              : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
          }`}
          title="Emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message… (Enter to send)"
            rows={1}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all max-h-32 overflow-y-auto disabled:opacity-50"
            style={{ height: '42px' }}
          />
          {/* Character counter */}
          <AnimatePresence>
            {showCharCounter && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute right-3 bottom-2.5 text-[10px] font-medium tabular-nums ${
                  isNearLimit ? 'text-red-500' : 'text-gray-400'
                }`}
              >
                {CHAR_MAX - charCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <motion.button
          onClick={handleSend}
          disabled={(!text.trim() && !file) || disabled || sending}
          animate={text.trim() || file ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
          whileTap={{ scale: 0.9 }}
          className="p-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 mb-0.5 shadow-sm"
        >
          {sending ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>

      {/* Hint */}
      <p className="text-[10px] text-gray-300 text-center pb-1.5 -mt-1 select-none">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
