import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PostCard } from '../components/PostCard'
import { StoryTray, StoryViewer, type StoryGroup } from '../components/StoryTray'
import {
  createStory,
  fetchActiveStories,
  fetchFollowingFeed,
  getFollowingIds,
} from '../lib/api'
import type { Post, Story } from '../lib/types'

export function HomePage() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewer, setViewer] = useState<{ group: StoryGroup; index: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError('')
    try {
      const following = await getFollowingIds(profile.uid)
      const [feed, activeStories] = await Promise.all([
        fetchFollowingFeed(following),
        fetchActiveStories(),
      ])
      setPosts(feed)
      setStories(activeStories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load feed')
    } finally {
      setLoading(false)
    }
  }, [profile])

  useEffect(() => {
    load()
  }, [load])

  async function onStoryFile(file: File | undefined) {
    if (!file || !profile) return
    try {
      await createStory(profile, file)
      const active = await fetchActiveStories()
      setStories(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Story upload failed')
    }
  }

  return (
    <div className="page">
      <div className="top-bar">
        <h1 className="brand-mark">
          CSG <span className="accent">Celebrate</span>
        </h1>
        <Link to="/app/messages" className="btn btn-ghost">
          Messages
        </Link>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => onStoryFile(e.target.files?.[0])}
      />

      <StoryTray
        stories={stories}
        onAdd={() => fileRef.current?.click()}
        onOpen={(group, index) => setViewer({ group, index })}
      />

      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="loading">Loading celebrations…</div>}
      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <h2>No posts yet</h2>
          <p>Be the first to share a win. Tap + to create a post.</p>
          <Link to="/app/create" className="btn btn-primary">
            Create post
          </Link>
        </div>
      )}
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}

      {viewer && (
        <StoryViewer
          group={viewer.group}
          startIndex={viewer.index}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}
