'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MessageSquare, Users, Bell, UserPlus, LogOut } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ContactList } from './ContactList'
import { FriendRequestModal } from './FriendRequestModal'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const TABS = ['Chats', 'Friends', 'Requests']

export function Sidebar({
  profile,
  conversations,
  contacts,
  friendRequests,
  incomingRequests,
  currentConversationId,
  onSendFriendRequest,
  onRespondToRequest,
  onNicknameUpdate,
  onConversationsRefetch,
  onContactsRefetch,
}) {
  const [tab, setTab] = useState('Chats')
  const [search, setSearch] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore signOut errors
    }
    // Force a full page navigation — router.push can fail in Chrome after session clears
    window.location.href = '/auth/login'
  }

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    const name = conv.nickname || conv.otherProfile?.full_name || conv.otherProfile?.email || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  const filteredContacts = contacts.filter(c => {
    const name = c.nickname || c.contact?.full_name || c.contact?.email || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <>
      <aside className="w-72 shrink-0 flex flex-col bg-white border-r border-gray-100 h-full">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow">
                <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">ChatSync</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                  tab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'Requests' && (
                  <span className="relative">
                    <Bell className="w-3.5 h-3.5" />
                    {incomingRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                    )}
                  </span>
                )}
                {t}
                {t === 'Requests' && incomingRequests.length > 0 && (
                  <Badge count={incomingRequests.length} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {tab === 'Chats' && (
            <ContactList
              conversations={filteredConversations}
              currentConversationId={currentConversationId}
              currentUserId={profile?.id}
              onNicknameUpdate={onNicknameUpdate}
            />
          )}

          {tab === 'Friends' && (
            <div className="flex-1 overflow-y-auto">
              {filteredContacts.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                  No friends yet. Add one!
                </div>
              ) : filteredContacts.map(c => {
                const name = c.nickname || c.contact?.full_name || c.contact?.email || 'User'
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <Avatar src={c.contact?.avatar_url} name={name} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.contact?.email}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'Requests' && (
            <div className="flex-1 overflow-y-auto">
              {incomingRequests.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                  No pending requests.
                </div>
              ) : incomingRequests.map(req => (
                <div key={req.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50">
                  <Avatar src={req.sender?.avatar_url} name={req.sender?.full_name || 'User'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{req.sender?.full_name}</p>
                    <p className="text-xs text-gray-400 truncate">{req.sender?.email}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        onRespondToRequest(req.id, 'accepted', req.sender_id)
                        onConversationsRefetch?.()
                        // Refresh contacts list so new friend shows in Friends tab
                        setTimeout(() => onContactsRefetch?.(), 800)
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onRespondToRequest(req.id, 'rejected', req.sender_id)}
                      className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User Profile + Add Friend */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
          <Avatar src={profile?.avatar_url} name={profile?.full_name || profile?.email} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{profile?.full_name || 'You'}</p>
            <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
          </div>
          <button
            onClick={() => setShowAddFriend(true)}
            className="p-2 text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm transition-colors shrink-0"
            title="Add Friend"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <FriendRequestModal
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
        onSend={onSendFriendRequest}
      />
    </>
  )
}
