'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async (userId) => {
      if (!userId) { setProfile(null); return }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
        setProfile(data || null)
      } catch {
        setProfile(null)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          await fetchProfile(currentUser?.id)
        } catch {
          // swallow any error
        } finally {
          setLoading(false)  // ALWAYS called, no matter what
        }
      }
    )

    // Safety net: if onAuthStateChange never fires (e.g. network issue), 
    // stop the spinner after 5 seconds
    const timeout = setTimeout(() => setLoading(false), 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  return { user, profile, loading }
}
