'use client'

import { useState } from 'react'
import { Check, X, Pencil } from 'lucide-react'

export function NicknameEditor({ currentNickname, fallbackName, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentNickname || '')

  const handleSave = async () => {
    const saved = await onSave(value)
    if (saved !== false) setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false) }}
          placeholder={fallbackName}
          className="text-sm border-b border-blue-400 focus:outline-none px-1 py-0.5 w-32 bg-transparent"
        />
        <button onClick={handleSave} className="text-green-500 hover:text-green-600 p-0.5">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="text-sm font-medium text-gray-800 truncate">
        {currentNickname || fallbackName}
      </span>
      <button
        onClick={() => { setValue(currentNickname || ''); setEditing(true) }}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-500 p-0.5"
      >
        <Pencil className="w-3 h-3" />
      </button>
    </div>
  )
}
