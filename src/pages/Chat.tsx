import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  clearUnread,
  listenMessages,
  sendMessage,
} from '../lib/api'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ChatMessage, Conversation } from '../lib/types'

export function ChatPage() {
  const { conversationId = '' } = useParams()
  const { profile } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conv, setConv] = useState<Conversation | null>(null)
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) return
    getDoc(doc(db, 'conversations', conversationId)).then((snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      setConv({
        id: snap.id,
        memberIds: data.memberIds || [],
        memberNames: data.memberNames || {},
        memberAvatars: data.memberAvatars || {},
        lastMessage: data.lastMessage || '',
        lastMessageAt: data.lastMessageAt || 0,
        unread: data.unread || {},
      })
    })
  }, [conversationId])

  useEffect(() => {
    if (!conversationId || !profile) return
    clearUnread(conversationId, profile.uid).catch(() => undefined)
    return listenMessages(conversationId, setMessages)
  }, [conversationId, profile])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!profile) return null

  const otherId = conv?.memberIds.find((id) => id !== profile.uid) || ''
  const otherName = conv?.memberNames[otherId] || 'Chat'

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!text.trim() && !file) return
    if (!otherId) return
    await sendMessage({
      conversationId,
      sender: profile,
      text,
      otherUid: otherId,
      file: file || undefined,
    })
    setText('')
    setFile(null)
  }

  return (
    <div className="page">
      <div className="top-bar">
        <Link to="/app/messages" className="btn btn-ghost">
          ←
        </Link>
        <h1 style={{ fontSize: '1.25rem' }}>{otherName}</h1>
        <span />
      </div>
      <div className="chat-thread">
        {messages.map((m) => (
          <div key={m.id} className={`bubble${m.senderId === profile.uid ? ' mine' : ''}`}>
            {m.text}
            {m.mediaUrl && <img src={m.mediaUrl} alt="" />}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form className="chat-compose" onSubmit={onSend}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={{ width: 90 }}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
        />
        <button type="submit" className="btn btn-primary">
          Send
        </button>
      </form>
    </div>
  )
}
