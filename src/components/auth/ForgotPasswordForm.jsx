'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) { toast.error('Please enter your email'); return }
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
      toast.success('Reset link sent! Check your email.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 mb-6">
          We sent a reset link to <strong>{email}</strong>
        </p>
        <Link href="/auth/login" className="text-blue-500 font-semibold hover:text-blue-600">
          Back to Sign In
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
      <p className="text-gray-500 mb-8">No worries, we&apos;ll send you reset instructions.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email address" type="email" placeholder="you@example.com"
          value={email} onChange={e => setEmail(e.target.value)} icon={Mail} />
        <Button type="submit" className="w-full" loading={loading} size="lg">
          Send Reset Link
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8">
        <Link href="/auth/login" className="text-blue-500 font-semibold hover:text-blue-600">
          ← Back to Sign In
        </Link>
      </p>
    </div>
  )
}
