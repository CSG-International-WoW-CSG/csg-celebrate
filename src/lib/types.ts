export type MediaItem = {
  url: string
  type: 'image' | 'video'
  width?: number
  height?: number
}

export type UserProfile = {
  uid: string
  email: string
  displayName: string
  username: string
  bio: string
  avatarUrl: string
  followerCount: number
  followingCount: number
  postCount: number
  createdAt: number
  updatedAt: number
}

export type Post = {
  id: string
  authorId: string
  authorName: string
  authorUsername: string
  authorAvatar: string
  caption: string
  media: MediaItem[]
  hashtags: string[]
  likeCount: number
  commentCount: number
  createdAt: number
  hidden?: boolean
  isVideo?: boolean
}

export type Comment = {
  id: string
  postId: string
  authorId: string
  authorName: string
  authorAvatar: string
  text: string
  createdAt: number
}

export type Story = {
  id: string
  authorId: string
  authorName: string
  authorAvatar: string
  mediaUrl: string
  createdAt: number
  expiresAt: number
}

export type NotificationItem = {
  id: string
  toUid: string
  fromUid: string
  fromName: string
  fromAvatar: string
  type: 'like' | 'comment' | 'follow'
  postId?: string
  text?: string
  createdAt: number
  read: boolean
}

export type Conversation = {
  id: string
  memberIds: string[]
  memberNames: Record<string, string>
  memberAvatars: Record<string, string>
  lastMessage: string
  lastMessageAt: number
  unread: Record<string, number>
}

export type ChatMessage = {
  id: string
  conversationId: string
  senderId: string
  text: string
  mediaUrl?: string
  createdAt: number
}

export const CORP_DOMAINS = ['@csgi.com', '@csg.com'] as const
export const ADMIN_EMAILS = ['wow-csg@csgi.com', 'admin@csgi.com'] as const

export function isCorporateEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const lower = email.trim().toLowerCase()
  return CORP_DOMAINS.some((d) => lower.endsWith(d))
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return (ADMIN_EMAILS as readonly string[]).includes(email.trim().toLowerCase())
}

export function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#[\w]+/g) || []
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))]
}
