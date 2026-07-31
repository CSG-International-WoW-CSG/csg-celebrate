import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  deletePost,
  fetchPostsByAuthor,
  followUser,
  getOrCreateConversation,
  getUserProfile,
  hidePost,
  isFollowing,
  unfollowUser,
} from '../lib/api'
import { isAdminEmail, type Post, type UserProfile } from '../lib/types'

export function ProfilePage() {
  const { uid } = useParams()
  const { profile: me, logout, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const targetUid = uid || me?.uid || ''
  const isSelf = Boolean(me && targetUid === me.uid)

  const [user, setUser] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!targetUid) return
      setLoading(true)
      try {
        const [u, p] = await Promise.all([
          getUserProfile(targetUid),
          fetchPostsByAuthor(targetUid),
        ])
        if (cancelled) return
        setUser(u)
        setPosts(p)
        if (me && !isSelf) {
          setFollowing(await isFollowing(me.uid, targetUid))
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [targetUid, me, isSelf])

  async function toggleFollow() {
    if (!me || !user || isSelf) return
    if (following) {
      await unfollowUser(me.uid, user.uid)
      setFollowing(false)
      setUser({ ...user, followerCount: Math.max(0, user.followerCount - 1) })
    } else {
      await followUser(me, user.uid)
      setFollowing(true)
      setUser({ ...user, followerCount: user.followerCount + 1 })
    }
    await refreshProfile()
  }

  async function message() {
    if (!me || !user) return
    const id = await getOrCreateConversation(me, user)
    navigate(`/app/messages/${id}`)
  }

  async function onHide(postId: string) {
    await hidePost(postId)
    setPosts((list) => list.filter((p) => p.id !== postId))
  }

  async function onDelete(post: Post) {
    await deletePost(post.id, post.authorId)
    setPosts((list) => list.filter((p) => p.id !== post.id))
    await refreshProfile()
  }

  if (loading) return <div className="loading">Loading profile…</div>
  if (!user) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Profile not found</h2>
        </div>
      </div>
    )
  }

  const avatar =
    user.avatarUrl ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user.displayName)}`
  const canModerate = isSelf || isAdminEmail(me?.email)

  return (
    <div className="page">
      {error && <div className="error-banner">{error}</div>}
      <div className="profile-header">
        <img className="avatar lg" src={avatar} alt="" />
        <div className="profile-stats">
          <div>
            <strong>{user.postCount}</strong>
            <span>posts</span>
          </div>
          <div>
            <strong>{user.followerCount}</strong>
            <span>followers</span>
          </div>
          <div>
            <strong>{user.followingCount}</strong>
            <span>following</span>
          </div>
        </div>
      </div>
      <div className="profile-bio">
        <strong>{user.displayName}</strong>
        <div className="muted">@{user.username}</div>
        {user.bio && <p style={{ margin: '0.5rem 0 0' }}>{user.bio}</p>}
      </div>
      <div className="profile-actions">
        {isSelf ? (
          <>
            <Link to="/app/edit-profile" className="btn btn-secondary">
              Edit profile
            </Link>
            <Link to="/app/messages" className="btn btn-ghost">
              Messages
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => logout()}>
              Sign out
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={toggleFollow}>
              {following ? 'Following' : 'Follow'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={message}>
              Message
            </button>
          </>
        )}
      </div>

      <div className="profile-grid">
        {posts.map((p) => (
          <Link key={p.id} to={`/app/post/${p.id}`}>
            {p.media[0]?.type === 'video' ? (
              <video src={p.media[0].url} muted />
            ) : (
              <img src={p.media[0]?.url} alt="" />
            )}
          </Link>
        ))}
      </div>

      {canModerate && posts.length > 0 && isSelf && (
        <div style={{ marginTop: '1.5rem' }}>
          <p className="muted">Moderation</p>
          {posts.slice(0, 5).map((p) => (
            <div key={p.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => onHide(p.id)}>
                Hide
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => onDelete(p)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
