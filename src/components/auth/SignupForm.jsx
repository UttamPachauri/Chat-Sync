'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export function SignupForm() {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const router = useRouter()
  const supabase = createClient()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.email) e.email = 'Email is required'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Account created! Please check your email to verify.')
      router.push('/auth/login')
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
      <p className="text-gray-500 mb-8">Join ChatSync and start connecting.</p>

      <form onSubmit={handleSignup} className="space-y-4">
        <Input label="Full Name" type="text" placeholder="Jane Doe" value={form.fullName}
          onChange={set('fullName')} icon={User} error={errors.fullName} />
        <Input label="Email address" type="email" placeholder="you@example.com" value={form.email}
          onChange={set('email')} icon={Mail} error={errors.email} />
        <Input label="Password" type={showPw ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password}
          onChange={set('password')} icon={Lock} error={errors.password}
          rightIcon={
            <button type="button" onClick={() => setShowPw(p => !p)} className="text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        <Input label="Confirm Password" type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm}
          onChange={set('confirm')} icon={Lock} error={errors.confirm} />

        <Button type="submit" className="w-full mt-2" loading={loading} size="lg">
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-8">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-blue-500 font-semibold hover:text-blue-600">
          Sign in
        </Link>
      </p>
    </div>
  )
}
