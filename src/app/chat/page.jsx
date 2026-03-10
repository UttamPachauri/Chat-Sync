'use client'

import { useUser } from '@/lib/hooks/useUser'
import { useConversations } from '@/lib/hooks/useConversations'
import { useContacts } from '@/lib/hooks/useContacts'
import { useFriendRequests } from '@/lib/hooks/useFriendRequests'
import { Sidebar } from '@/components/chat/Sidebar'
import { EmptyState } from '@/components/chat/EmptyState'

export default function ChatPage() {
  const { user, profile } = useUser()
  const { conversations, refetch } = useConversations(user?.id)
  const { contacts, updateNickname, refetch: refetchContacts } = useContacts(user?.id)
  const { incomingRequests, sendRequest, respondToRequest } = useFriendRequests(user?.id)

  // No loading check needed — server layout already guarantees user is authenticated

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar
        profile={profile}
        conversations={conversations}
        contacts={contacts}
        incomingRequests={incomingRequests}
        currentConversationId={null}
        onSendFriendRequest={sendRequest}
        onRespondToRequest={respondToRequest}
        onNicknameUpdate={updateNickname}
        onConversationsRefetch={refetch}
        onContactsRefetch={refetchContacts}
      />
      <main className="flex-1 flex overflow-hidden">
        <EmptyState />
      </main>
    </div>
  )
}
