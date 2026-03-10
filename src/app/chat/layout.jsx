import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlobalCallProvider } from '@/components/chat/GlobalCallProvider'

// Server component — auth guard runs on server
// GlobalCallProvider is a client component that handles incoming call signals
export default async function ChatLayout({ children }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      redirect('/auth/login')
    }
  } catch {
    redirect('/auth/login')
  }

  return <GlobalCallProvider>{children}</GlobalCallProvider>
}
