import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Server component — checks auth before any redirect
export default async function HomePage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      redirect('/chat')
    } else {
      redirect('/auth/login')
    }
  } catch {
    // If server client fails, send to login
    redirect('/auth/login')
  }
}
