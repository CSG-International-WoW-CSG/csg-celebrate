import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchExplorePosts,
  fetchVideoPosts,
  searchByHashtag,
  searchUsers,
} from '../lib/api'
import type { Post, UserProfile } from '../lib/types'

export function ExplorePage() {
  const [tab, setTab] = useState<'explore' | 'reels' | 'people'>('explore')
  const [query, setQuery] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [videos, setVideos] = useState<Post[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [explore, vids] = await Promise.all([fetchExplorePosts(), fetchVideoPosts()])
        if (!cancelled) {
          setPosts(explore)
          setVideos(vids)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Explore failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setUsers([])
      return
    }
    const t = window.setTimeout(async () => {
      try {
        if (q.startsWith('#')) {
          const tagged = await searchByHashtag(q)
          setPosts(tagged)
          setTab('explore')
        } else {
          const found = await searchUsers(q)
          setUsers(found)
          setTab('people')
        }
      } catch {
        /* ignore */
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [query])

  return (
    <div className="page">
      <div className="top-bar">
        <h1>Explore</h1>
        <Link to="/app/reels" className="btn btn-ghost">
          Reels
        </Link>
      </div>
      <input
        className="search-bar"
        placeholder="Search people or #hashtags"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="tabs">
        <button type="button" className={tab === 'explore' ? 'active' : ''} onClick={() => setTab('explore')}>
          Trending
        </button>
        <button type="button" className={tab === 'reels' ? 'active' : ''} onClick={() => setTab('reels')}>
          Video
        </button>
        <button type="button" className={tab === 'people' ? 'active' : ''} onClick={() => setTab('people')}>
          People
        </button>
      </div>
      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Loading…</div>}

      {tab === 'people' && (
        <div>
          {users.map((u) => (
            <Link key={u.uid} to={`/app/u/${u.uid}`} className="user-result">
              <img
                className="avatar"
                src={
                  u.avatarUrl ||
                  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(u.displayName)}`
                }
                alt=""
              />
              <div>
                <strong>{u.displayName}</strong>
                <div className="muted">@{u.username}</div>
              </div>
            </Link>
          ))}
          {!loading && users.length === 0 && query && (
            <p className="muted">No people matched “{query}”.</p>
          )}
        </div>
      )}

      {tab === 'explore' && (
        <div className="explore-grid">
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
      )}

      {tab === 'reels' && (
        <div className="explore-grid">
          {videos.map((p) => (
            <Link key={p.id} to="/app/reels">
              <video src={p.media.find((m) => m.type === 'video')?.url} muted />
            </Link>
          ))}
          {!loading && videos.length === 0 && (
            <p className="muted" style={{ gridColumn: '1 / -1' }}>
              No short videos yet. Upload a clip from Create.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
