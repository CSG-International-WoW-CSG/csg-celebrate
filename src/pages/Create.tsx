import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createPost } from '../lib/api'
import { validateVideo } from '../lib/media'

export function CreatePage() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [caption, setCaption] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function onFiles(list: FileList | null) {
    if (!list) return
    const next = [...files, ...Array.from(list)].slice(0, 10)
    setFiles(next)
    setPreviews(next.map((f) => URL.createObjectURL(f)))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (files.length === 0) {
      setError('Add at least one photo or short video')
      return
    }
    setBusy(true)
    setError('')
    try {
      for (const f of files) {
        if (f.type.startsWith('video/')) await validateVideo(f, 60)
      }
      const id = await createPost({ author: profile, caption, files })
      await refreshProfile()
      navigate(`/app/post/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="top-bar">
        <h1>New post</h1>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Up to 10 photos, or short videos (≤60s). Images are compressed before upload.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="media">Media</label>
          <input
            id="media"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
        {previews.length > 0 && (
          <div className="explore-grid" style={{ marginBottom: '1rem' }}>
            {files.map((f, i) =>
              f.type.startsWith('video/') ? (
                <video key={i} src={previews[i]} muted />
              ) : (
                <img key={i} src={previews[i]} alt="" />
              ),
            )}
          </div>
        )}
        <div className="field">
          <label htmlFor="caption">Caption</label>
          <textarea
            id="caption"
            rows={4}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Celebrate a win… use #hashtags"
            maxLength={2200}
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Sharing…' : 'Share'}
        </button>
      </form>
    </div>
  )
}
