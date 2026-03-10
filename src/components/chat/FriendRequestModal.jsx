'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export function FriendRequestModal({ isOpen, onClose, onSend }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    // Safety timeout — if onSend never resolves, reset after 15s
    const safetyTimer = setTimeout(() => setLoading(false), 15000)

    try {
      const result = await onSend(email.trim())
      // Only close if the request actually succeeded
      if (result?.success) {
        setEmail('')
        onClose()
      }
    } catch (err) {
      toast.error('Something went wrong. Try again.')
    } finally {
      clearTimeout(safetyTimer)
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return  // Don't close while sending
    setEmail('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Friend">
      <form onSubmit={handleSend} className="space-y-4">
        <p className="text-sm text-gray-500">
          Enter their email address to send a friend request.
        </p>
        <Input
          label="Email address"
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoFocus
          disabled={loading}
        />
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="secondary" onClick={handleClose} type="button" disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  )
}
