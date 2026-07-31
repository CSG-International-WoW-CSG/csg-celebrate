import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listenNotifications, markNotificationsRead } from '../lib/api'
import type { NotificationItem } from '../lib/types'

export function ActivityPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<NotificationItem[]>([])

  useEffect(() => {
    if (!profile) return
    const unsub = listenNotifications(profile.uid, (list) => {
      setItems(list)
      const unread = list.filter((n) => !n.read).map((n) => n.id)
      if (unread.length) markNotificationsRead(unread).catch(() => undefined)
    })
    return unsub
  }, [profile])

  return (
    <div className="page">
      <div className="top-bar">
        <h1>Activity</h1>
      </div>
      {items.length === 0 && (
        <div className="empty-state">
          <h2>All caught up</h2>
          <p>Likes, comments, and new followers show up here.</p>
        </div>
      )}
      {items.map((n) => (
        <div key={n.id} className={`activity-item${n.read ? '' : ' unread'}`}>
          <img
            className="avatar"
            src={
              n.fromAvatar ||
              `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(n.fromName)}`
            }
            alt=""
          />
          <div style={{ flex: 1 }}>
            <Link to={`/app/u/${n.fromUid}`}>
              <strong>{n.fromName}</strong>
            </Link>{' '}
            {n.type === 'like' && 'liked your post'}
            {n.type === 'comment' && `commented: ${n.text || ''}`}
            {n.type === 'follow' && 'started following you'}
            <div className="muted" style={{ fontSize: '0.75rem' }}>
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>
          {n.postId && (
            <Link to={`/app/post/${n.postId}`} className="btn btn-ghost">
              View
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
