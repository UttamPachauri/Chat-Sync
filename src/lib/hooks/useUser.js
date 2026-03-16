'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUser() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfile = async (currentUser) => {
      if (!currentUser?.id) { setProfile(null); return }
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error.message)
        }

        const fallback = {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser?.user_metadata?.full_name || currentUser.email,
          avatar_url: currentUser?.user_metadata?.avatar_url || null
        }

        setProfile(data ? {
          ...data,
          full_name: data.full_name || fallback.full_name,
          email: data.email || fallback.email,
          avatar_url: data.avatar_url || fallback.avatar_url
        } : fallback)

      } catch (error) {
        console.error("Exception fetching profile:", error)
        setProfile({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser?.user_metadata?.full_name || currentUser.email,
          avatar_url: currentUser?.user_metadata?.avatar_url || null
        })
      }
    }

    const fetchUserAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        setUser(currentUser)
        await fetchProfile(currentUser)
      } catch (err) {
        console.error("Error fetching user session:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          const currentUser = session?.user ?? null
          setUser(currentUser)
          await fetchProfile(currentUser)
        } catch {
          // swallow any error
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
