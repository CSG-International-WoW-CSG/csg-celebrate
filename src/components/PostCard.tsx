import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addComment, fetchComments, hasLiked, toggleLike } from '../lib/api'
import type { Comment, Post } from '../lib/types'
import { useAuth } from '../context/AuthContext'

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

type Props = {
  post: Post
  showComments?: boolean
}

export function PostCard({ post, showComments = false }: Props) {
  const { profile } = useAuth()
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [openComments, setOpenComments] = useState(showComments)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    hasLiked(post.id, profile.uid).then(setLiked).catch(() => undefined)
  }, [post.id, profile])

  useEffect(() => {
    if (!openComments) return
    fetchComments(post.id).then(setComments).catch(() => setComments([]))
  }, [openComments, post.id])

  async function onLike() {
    if (!profile || busy) return
    setBusy(true)
    try {
      const nowLiked = await toggleLike(post, profile.uid, profile)
      setLiked(nowLiked)
      setLikeCount((c) => c + (nowLiked ? 1 : -1))
    } finally {
      setBusy(false)
    }
  }

  async function onComment(e: { preventDefault: () => void }) {
    e.preventDefault()
    if (!profile || !commentText.trim()) return
    await addComment(post, profile, commentText)
    setCommentText('')
    setCommentCount((c) => c + 1)
    const list = await fetchComments(post.id)
    setComments(list)
  }

  const avatar =
    post.authorAvatar ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(post.authorName || 'CSG')}`

  return (
    <article className="post">
      <header className="post-header">
        <Link to={`/app/u/${post.authorId}`}>
          <img className="avatar" src={avatar} alt="" />
        </Link>
        <div className="meta">
          <Link to={`/app/u/${post.authorId}`} className="name">
            {post.authorName}
          </Link>
          <span className="time">{timeAgo(post.createdAt)}</span>
        </div>
      </header>

      {post.media.length > 1 ? (
        <div className="post-media-carousel">
          {post.media.map((m, i) =>
            m.type === 'video' ? (
              <video key={i} src={m.url} controls playsInline />
            ) : (
              <img key={i} src={m.url} alt="" />
            ),
          )}
        </div>
      ) : (
        <div className="post-media">
          {post.media[0]?.type === 'video' ? (
            <video src={post.media[0].url} controls playsInline />
          ) : (
            <img src={post.media[0]?.url} alt="" />
          )}
        </div>
      )}

      <div className="post-actions">
        <button
          type="button"
          className={liked ? 'liked' : ''}
          onClick={onLike}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          {liked ? '♥' : '♡'}
        </button>
        <button type="button" onClick={() => setOpenComments((v) => !v)} aria-label="Comments">
          💬
        </button>
        <Link to={`/app/post/${post.id}`} aria-label="Open post">
          ↗
        </Link>
      </div>

      <div className="post-stats">
        {likeCount} like{likeCount === 1 ? '' : 's'} · {commentCount} comment
        {commentCount === 1 ? '' : 's'}
      </div>

      {post.caption && (
        <p className="post-caption">
          <Link to={`/app/u/${post.authorId}`} className="user">
            {post.authorUsername || post.authorName}
          </Link>
          {post.caption}
        </p>
      )}

      {openComments && (
        <>
          <div className="comment-list">
            {comments.map((c) => (
              <div key={c.id} className="comment-row">
                <strong>{c.authorName}</strong>
                {c.text}
              </div>
            ))}
          </div>
          <form className="comment-form" onSubmit={onComment}>
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment…"
              maxLength={500}
            />
            <button type="submit" className="btn btn-primary" disabled={!commentText.trim()}>
              Post
            </button>
          </form>
        </>
      )}
    </article>
  )
}

export function initialsAvatar(name: string) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || 'CSG')}`
}
