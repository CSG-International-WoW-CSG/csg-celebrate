import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PostCard } from '../components/PostCard'
import { getPost } from '../lib/api'
import type { Post } from '../lib/types'

export function PostDetailPage() {
  const { postId = '' } = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPost(postId)
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false))
  }, [postId])

  if (loading) return <div className="loading">Loading…</div>
  if (!post) {
    return (
      <div className="page">
        <div className="empty-state">
          <h2>Post not found</h2>
          <Link to="/app" className="btn btn-primary">
            Back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="top-bar">
        <Link to="/app" className="btn btn-ghost">
          ← Back
        </Link>
        <h1 style={{ fontSize: '1.2rem' }}>Post</h1>
        <span />
      </div>
      <PostCard post={post} showComments />
    </div>
  )
}
