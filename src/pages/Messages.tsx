import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listenConversations } from '../lib/api'
import type { Conversation } from '../lib/types'

export function MessagesPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<Conversation[]>([])

  useEffect(() => {
    if (!profile) return
    return listenConversations(profile.uid, setItems)
  }, [profile])

  if (!profile) return null

  return (
    <div className="page">
      <div className="top-bar">
        <h1>Messages</h1>
      </div>
      {items.length === 0 && (
        <div className="empty-state">
          <h2>No conversations yet</h2>
          <p>Open a profile and tap Message to start a 1:1 chat.</p>
        </div>
      )}
      {items.map((c) => {
        const otherId = c.memberIds.find((id) => id !== profile.uid) || ''
        const name = c.memberNames[otherId] || 'Teammate'
        const avatar = c.memberAvatars[otherId]
        const unread = c.unread[profile.uid] || 0
        return (
          <Link key={c.id} to={`/app/messages/${c.id}`} className="dm-row">
            <img
              className="avatar"
              src={
                avatar ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`
              }
              alt=""
            />
            <div className="preview">
              <strong>
                {name}
                {unread > 0 ? ` (${unread})` : ''}
              </strong>
              <p>{c.lastMessage || 'Say hello'}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
