'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function UpdatePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated! Please sign in.')
      await supabase.auth.signOut()
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Set new password</h1>
      <p className="text-gray-500 mb-8">Create a strong password for your account.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="New Password" type="password" placeholder="Min 6 characters"
          value={password} onChange={e => setPassword(e.target.value)} icon={Lock} />
        <Input label="Confirm Password" type="password" placeholder="Repeat password"
          value={confirm} onChange={e => setConfirm(e.target.value)} icon={Lock} />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          Update Password
        </Button>
      </form>
    </div>
  )
}
