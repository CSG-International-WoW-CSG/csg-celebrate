import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVideoPosts } from '../lib/api'
import type { Post } from '../lib/types'

export function ReelsPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVideoPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page" style={{ paddingTop: 0 }}>
      <div className="top-bar" style={{ padding: '1rem 1rem 0' }}>
        <h1>Reels</h1>
        <Link to="/app/explore" className="btn btn-ghost">
          Explore
        </Link>
      </div>
      {loading && <div className="loading">Loading…</div>}
      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <h2>No reels yet</h2>
          <p>Post a short video (≤60s) from Create to appear here.</p>
        </div>
      )}
      <div className="reels-viewer">
        {posts.map((p) => {
          const video = p.media.find((m) => m.type === 'video')
          if (!video) return null
          return (
            <div key={p.id} className="reel-slide">
              <video src={video.url} controls playsInline loop />
              <div className="reel-meta">
                <Link to={`/app/u/${p.authorId}`}>
                  <strong>{p.authorName}</strong>
                </Link>
                <p style={{ margin: '0.35rem 0 0' }}>{p.caption}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
