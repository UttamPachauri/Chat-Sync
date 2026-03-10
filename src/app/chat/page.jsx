'use client'

import { useUser } from '@/lib/hooks/useUser'
import { useConversations } from '@/lib/hooks/useConversations'
import { useContacts } from '@/lib/hooks/useContacts'
import { useFriendRequests } from '@/lib/hooks/useFriendRequests'
import { Sidebar } from '@/components/chat/Sidebar'
import { EmptyState } from '@/components/chat/EmptyState'

export default function ChatPage() {
  const { user, profile, loading: userLoading } = useUser()
  const { conversations, refetch } = useConversations(user?.id)
  const { contacts, updateNickname, refetch: refetchContacts } = useContacts(user?.id)
  const { incomingRequests, sendRequest, respondToRequest } = useFriendRequests(user?.id)

  // Show a spinner while we're resolving the session
  if (userLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    )
  }

  // Middleware guards this route, but just in case
  if (!user) return null

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
