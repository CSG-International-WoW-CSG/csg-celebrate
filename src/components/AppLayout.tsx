import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { BottomNav } from './BottomNav'
import { listenConversations, listenNotifications } from '../lib/api'
import { isFirebaseConfigured } from '../lib/firebase'

export function RequireAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

export function AppLayout() {
  const { profile } = useAuth()
  const [activityCount, setActivityCount] = useState(0)
  const [dmCount, setDmCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    const unsubN = listenNotifications(profile.uid, (items) => {
      setActivityCount(items.filter((i) => !i.read).length)
    })
    const unsubC = listenConversations(profile.uid, (items) => {
      setDmCount(items.reduce((sum, c) => sum + (c.unread[profile.uid] || 0), 0))
    })
    return () => {
      unsubN()
      unsubC()
    }
  }, [profile])

  return (
    <div className="app-shell">
      {!isFirebaseConfigured && (
        <div className="page" style={{ paddingBottom: 0 }}>
          <div className="warn-banner">
            Firebase is not configured. Copy <code>.env.example</code> to{' '}
            <code>.env.local</code> and create a new Firebase project. See README.
          </div>
        </div>
      )}
      <Outlet />
      <BottomNav activityCount={activityCount} dmCount={dmCount} />
    </div>
  )
}
