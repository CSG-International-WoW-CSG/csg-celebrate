import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile, uploadAvatar } from '../lib/api'

export function EditProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(profile?.displayName || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (!profile) return null

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    setBusy(true)
    setError('')
    try {
      let avatarUrl = profile.avatarUrl
      if (file) avatarUrl = await uploadAvatar(profile.uid, file)
      await updateUserProfile(profile.uid, {
        displayName: displayName.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        bio: bio.trim(),
        avatarUrl,
      })
      await refreshProfile()
      navigate('/app/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="top-bar">
        <h1>Edit profile</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="avatar">Avatar</label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>
        <div className="field">
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy} style={{ width: '100%' }}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}
