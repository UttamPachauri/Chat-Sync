'use client'

import { use, useEffect, useState } from 'react'
import { useUser } from '@/lib/hooks/useUser'
import { useConversations } from '@/lib/hooks/useConversations'
import { useContacts } from '@/lib/hooks/useContacts'
import { useFriendRequests } from '@/lib/hooks/useFriendRequests'
import { Sidebar } from '@/components/chat/Sidebar'
import { ConversationView } from '@/components/chat/ConversationView'
import { createClient } from '@/lib/supabase/client'

export default function ConversationPage({ params }) {
  const { conversationId } = use(params)
  const { user, profile } = useUser()
  const { conversations, refetch } = useConversations(user?.id)
  const { contacts, updateNickname, refetch: refetchContacts } = useContacts(user?.id)
  const { incomingRequests, sendRequest, respondToRequest } = useFriendRequests(user?.id)
  const [convDetails, setConvDetails] = useState(null)
  const supabase = createClient()

  // No auth loading/redirect needed — server layout guarantees user is authenticated

  useEffect(() => {
    if (!conversationId || !user?.id) return

    const fetchDetails = async () => {
      const { data } = await supabase
        .from('conversations')
        .select(`
          *,
          profile1:profiles!conversations_participant_1_fkey(id, full_name, email, avatar_url),
          profile2:profiles!conversations_participant_2_fkey(id, full_name, email, avatar_url)
        `)
        .eq('id', conversationId)
        .single()

      if (data) {
        const otherProfile = data.participant_1 === user.id ? data.profile2 : data.profile1
        const otherId = data.participant_1 === user.id ? data.participant_2 : data.participant_1
        const { data: contact } = await supabase
          .from('contacts')
          .select('nickname')
          .eq('owner_id', user.id)
          .eq('contact_id', otherId)
          .maybeSingle()
        setConvDetails({ ...data, otherProfile, nickname: contact?.nickname })
      }
    }

    fetchDetails()
  }, [conversationId, user?.id])

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden relative">
      <div className="hidden md:flex">
        <Sidebar
          profile={profile}
          conversations={conversations}
          contacts={contacts}
          incomingRequests={incomingRequests}
          currentConversationId={conversationId}
          onSendFriendRequest={sendRequest}
          onRespondToRequest={respondToRequest}
          onNicknameUpdate={updateNickname}
          onConversationsRefetch={refetch}
          onContactsRefetch={refetchContacts}
        />
      </div>
      <main className="flex-1 flex overflow-hidden">
        <ConversationView
          conversationId={conversationId}
          currentUser={user ? { ...user, ...profile } : null}
          otherProfile={convDetails?.otherProfile}
          nickname={convDetails?.nickname}
        />
      </main>
    </div>
  )
}
