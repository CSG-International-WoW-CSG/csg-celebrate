import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  increment,
  type Unsubscribe,
  type DocumentData,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './firebase'
import { compressImage } from './media'
import {
  extractHashtags,
  type ChatMessage,
  type Comment,
  type Conversation,
  type MediaItem,
  type NotificationItem,
  type Post,
  type Story,
  type UserProfile,
} from './types'

function mapUser(id: string, data: DocumentData): UserProfile {
  return {
    uid: id,
    email: data.email || '',
    displayName: data.displayName || '',
    username: data.username || '',
    bio: data.bio || '',
    avatarUrl: data.avatarUrl || '',
    followerCount: data.followerCount || 0,
    followingCount: data.followingCount || 0,
    postCount: data.postCount || 0,
    createdAt: data.createdAt || 0,
    updatedAt: data.updatedAt || 0,
  }
}

function mapPost(id: string, data: DocumentData): Post {
  return {
    id,
    authorId: data.authorId,
    authorName: data.authorName || '',
    authorUsername: data.authorUsername || '',
    authorAvatar: data.authorAvatar || '',
    caption: data.caption || '',
    media: data.media || [],
    hashtags: data.hashtags || [],
    likeCount: data.likeCount || 0,
    commentCount: data.commentCount || 0,
    createdAt: data.createdAt || 0,
    hidden: Boolean(data.hidden),
    isVideo: Boolean(data.isVideo),
  }
}

export async function ensureUserProfile(
  uid: string,
  email: string,
  displayName: string,
): Promise<UserProfile> {
  const refDoc = doc(db, 'users', uid)
  const snap = await getDoc(refDoc)
  if (snap.exists()) return mapUser(uid, snap.data())

  const username =
    displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .slice(0, 20) || email.split('@')[0].toLowerCase()

  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    username,
    bio: '',
    avatarUrl: '',
    followerCount: 0,
    followingCount: 0,
    postCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  await setDoc(refDoc, profile)
  return profile
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return mapUser(uid, snap.data())
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, 'displayName' | 'username' | 'bio' | 'avatarUrl'>>,
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...patch, updatedAt: Date.now() })
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  const blob = await compressImage(file, 512, 0.85)
  const storageRef = ref(storage, `avatars/${uid}/${Date.now()}.jpg`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

export async function createPost(params: {
  author: UserProfile
  caption: string
  files: File[]
}): Promise<string> {
  const postRef = doc(collection(db, 'posts'))
  const media: MediaItem[] = []
  let isVideo = false

  for (let i = 0; i < Math.min(params.files.length, 10); i++) {
    const file = params.files[i]
    const isVid = file.type.startsWith('video/')
    isVideo = isVideo || isVid
    const path = `posts/${params.author.uid}/${postRef.id}/${i}-${Date.now()}`
    const storageRef = ref(storage, path)
    if (isVid) {
      await uploadBytes(storageRef, file, { contentType: file.type })
      media.push({ url: await getDownloadURL(storageRef), type: 'video' })
    } else {
      const blob = await compressImage(file)
      await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
      media.push({ url: await getDownloadURL(storageRef), type: 'image' })
    }
  }

  const hashtags = extractHashtags(params.caption)
  const now = Date.now()
  await setDoc(postRef, {
    authorId: params.author.uid,
    authorName: params.author.displayName,
    authorUsername: params.author.username,
    authorAvatar: params.author.avatarUrl,
    caption: params.caption,
    media,
    hashtags,
    likeCount: 0,
    commentCount: 0,
    createdAt: now,
    hidden: false,
    isVideo,
  })

  await updateDoc(doc(db, 'users', params.author.uid), {
    postCount: increment(1),
    updatedAt: now,
  })

  for (const tag of hashtags) {
    const tagRef = doc(db, 'hashtags', tag)
    const tagSnap = await getDoc(tagRef)
    if (tagSnap.exists()) {
      await updateDoc(tagRef, { count: increment(1), lastUsedAt: now })
    } else {
      await setDoc(tagRef, { tag, count: 1, lastUsedAt: now })
    }
    await setDoc(doc(db, 'postHashtags', `${postRef.id}_${tag}`), {
      postId: postRef.id,
      tag,
      createdAt: now,
    })
  }

  return postRef.id
}

export async function fetchRecentPosts(max = 40): Promise<Post[]> {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(max))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapPost(d.id, d.data())).filter((p) => !p.hidden)
}

export async function fetchPostsByAuthor(uid: string): Promise<Post[]> {
  const q = query(
    collection(db, 'posts'),
    where('authorId', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(60),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapPost(d.id, d.data())).filter((p) => !p.hidden)
}

export async function fetchFollowingFeed(
  followingIds: string[],
  max = 40,
): Promise<Post[]> {
  if (followingIds.length === 0) return fetchRecentPosts(max)
  // Firestore 'in' supports max 10 — batch and merge
  const batches: string[][] = []
  for (let i = 0; i < Math.min(followingIds.length, 30); i += 10) {
    batches.push(followingIds.slice(i, i + 10))
  }
  const posts: Post[] = []
  for (const batch of batches) {
    const q = query(
      collection(db, 'posts'),
      where('authorId', 'in', batch),
      orderBy('createdAt', 'desc'),
      limit(20),
    )
    const snap = await getDocs(q)
    posts.push(...snap.docs.map((d) => mapPost(d.id, d.data())))
  }
  posts.sort((a, b) => b.createdAt - a.createdAt)
  const discovery = await fetchRecentPosts(20)
  const seen = new Set(posts.map((p) => p.id))
  for (const p of discovery) {
    if (!seen.has(p.id)) posts.push(p)
  }
  return posts.filter((p) => !p.hidden).slice(0, max)
}

export async function getPost(postId: string): Promise<Post | null> {
  const snap = await getDoc(doc(db, 'posts', postId))
  if (!snap.exists()) return null
  return mapPost(postId, snap.data())
}

export async function toggleLike(
  post: Post,
  uid: string,
  fromProfile: UserProfile,
): Promise<boolean> {
  const likeId = `${post.id}_${uid}`
  const likeRef = doc(db, 'postLikes', likeId)
  const snap = await getDoc(likeRef)
  if (snap.exists()) {
    await deleteDoc(likeRef)
    await updateDoc(doc(db, 'posts', post.id), { likeCount: increment(-1) })
    return false
  }
  await setDoc(likeRef, { postId: post.id, uid, createdAt: Date.now() })
  await updateDoc(doc(db, 'posts', post.id), { likeCount: increment(1) })
  if (post.authorId !== uid) {
    await addNotification({
      toUid: post.authorId,
      fromUid: uid,
      fromName: fromProfile.displayName,
      fromAvatar: fromProfile.avatarUrl,
      type: 'like',
      postId: post.id,
    })
  }
  return true
}

export async function hasLiked(postId: string, uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'postLikes', `${postId}_${uid}`))
  return snap.exists()
}

export async function addComment(
  post: Post,
  author: UserProfile,
  text: string,
): Promise<void> {
  await addDoc(collection(db, 'comments'), {
    postId: post.id,
    authorId: author.uid,
    authorName: author.displayName,
    authorAvatar: author.avatarUrl,
    text: text.trim(),
    createdAt: Date.now(),
  })
  await updateDoc(doc(db, 'posts', post.id), { commentCount: increment(1) })
  if (post.authorId !== author.uid) {
    await addNotification({
      toUid: post.authorId,
      fromUid: author.uid,
      fromName: author.displayName,
      fromAvatar: author.avatarUrl,
      type: 'comment',
      postId: post.id,
      text: text.trim().slice(0, 120),
    })
  }
}

export async function fetchComments(postId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'comments'),
    where('postId', '==', postId),
    orderBy('createdAt', 'asc'),
    limit(100),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      postId: data.postId,
      authorId: data.authorId,
      authorName: data.authorName || '',
      authorAvatar: data.authorAvatar || '',
      text: data.text || '',
      createdAt: data.createdAt || 0,
    }
  })
}

export async function followUser(
  follower: UserProfile,
  followingUid: string,
): Promise<void> {
  if (follower.uid === followingUid) return
  const followId = `${follower.uid}_${followingUid}`
  const followRef = doc(db, 'follows', followId)
  if ((await getDoc(followRef)).exists()) return
  await setDoc(followRef, {
    followerId: follower.uid,
    followingId: followingUid,
    createdAt: Date.now(),
  })
  await updateDoc(doc(db, 'users', follower.uid), { followingCount: increment(1) })
  await updateDoc(doc(db, 'users', followingUid), { followerCount: increment(1) })
  await addNotification({
    toUid: followingUid,
    fromUid: follower.uid,
    fromName: follower.displayName,
    fromAvatar: follower.avatarUrl,
    type: 'follow',
  })
}

export async function unfollowUser(followerUid: string, followingUid: string): Promise<void> {
  const followId = `${followerUid}_${followingUid}`
  const followRef = doc(db, 'follows', followId)
  if (!(await getDoc(followRef)).exists()) return
  await deleteDoc(followRef)
  await updateDoc(doc(db, 'users', followerUid), { followingCount: increment(-1) })
  await updateDoc(doc(db, 'users', followingUid), { followerCount: increment(-1) })
}

export async function isFollowing(followerUid: string, followingUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'follows', `${followerUid}_${followingUid}`))
  return snap.exists()
}

export async function getFollowingIds(uid: string): Promise<string[]> {
  const q = query(collection(db, 'follows'), where('followerId', '==', uid), limit(200))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data().followingId as string)
}

export async function createStory(author: UserProfile, file: File): Promise<string> {
  const storyRef = doc(collection(db, 'stories'))
  const blob = await compressImage(file, 1080, 0.8)
  // Path must match storage.rules: stories/{uid}/{storyId}/{fileName}
  const storageRef = ref(storage, `stories/${author.uid}/${storyRef.id}/media.jpg`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  const mediaUrl = await getDownloadURL(storageRef)
  const now = Date.now()
  const expiresAt = now + 24 * 60 * 60 * 1000
  await setDoc(storyRef, {
    authorId: author.uid,
    authorName: author.displayName,
    authorAvatar: author.avatarUrl,
    mediaUrl,
    createdAt: now,
    expiresAt,
  })
  return storyRef.id
}

export async function fetchActiveStories(): Promise<Story[]> {
  const now = Date.now()
  const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(80))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => {
      const data = d.data()
      return {
        id: d.id,
        authorId: data.authorId,
        authorName: data.authorName || '',
        authorAvatar: data.authorAvatar || '',
        mediaUrl: data.mediaUrl,
        createdAt: data.createdAt || 0,
        expiresAt: data.expiresAt || 0,
      } as Story
    })
    .filter((s) => s.expiresAt > now)
}

async function addNotification(
  n: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>,
): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    ...n,
    createdAt: Date.now(),
    read: false,
  })
}

export function listenNotifications(
  uid: string,
  cb: (items: NotificationItem[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('toUid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(50),
  )
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          toUid: data.toUid,
          fromUid: data.fromUid,
          fromName: data.fromName || '',
          fromAvatar: data.fromAvatar || '',
          type: data.type,
          postId: data.postId,
          text: data.text,
          createdAt: data.createdAt || 0,
          read: Boolean(data.read),
        }
      }),
    )
  })
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => updateDoc(doc(db, 'notifications', id), { read: true })))
}

export async function searchUsers(term: string): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), orderBy('displayName'), limit(80))
  const snap = await getDocs(q)
  const lower = term.toLowerCase()
  return snap.docs
    .map((d) => mapUser(d.id, d.data()))
    .filter(
      (u) =>
        u.displayName.toLowerCase().includes(lower) ||
        u.username.toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower),
    )
    .slice(0, 30)
}

export async function searchByHashtag(tag: string): Promise<Post[]> {
  const clean = tag.replace(/^#/, '').toLowerCase()
  const q = query(
    collection(db, 'postHashtags'),
    where('tag', '==', clean),
    orderBy('createdAt', 'desc'),
    limit(40),
  )
  const snap = await getDocs(q)
  const posts: Post[] = []
  for (const d of snap.docs) {
    const post = await getPost(d.data().postId)
    if (post && !post.hidden) posts.push(post)
  }
  return posts
}

export async function fetchExplorePosts(): Promise<Post[]> {
  const q = query(collection(db, 'posts'), orderBy('likeCount', 'desc'), limit(40))
  const snap = await getDocs(q)
  return snap.docs.map((d) => mapPost(d.id, d.data())).filter((p) => !p.hidden)
}

export async function fetchVideoPosts(): Promise<Post[]> {
  const all = await fetchRecentPosts(60)
  return all.filter((p) => p.isVideo || p.media.some((m) => m.type === 'video'))
}

export async function hidePost(postId: string): Promise<void> {
  await updateDoc(doc(db, 'posts', postId), { hidden: true })
}

export async function deletePost(postId: string, authorId: string): Promise<void> {
  await deleteDoc(doc(db, 'posts', postId))
  await updateDoc(doc(db, 'users', authorId), { postCount: increment(-1) })
}

export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join('_')
}

export async function getOrCreateConversation(
  me: UserProfile,
  other: UserProfile,
): Promise<string> {
  const id = conversationIdFor(me.uid, other.uid)
  const refDoc = doc(db, 'conversations', id)
  const snap = await getDoc(refDoc)
  if (!snap.exists()) {
    await setDoc(refDoc, {
      memberIds: [me.uid, other.uid],
      memberNames: {
        [me.uid]: me.displayName,
        [other.uid]: other.displayName,
      },
      memberAvatars: {
        [me.uid]: me.avatarUrl,
        [other.uid]: other.avatarUrl,
      },
      lastMessage: '',
      lastMessageAt: Date.now(),
      unread: { [me.uid]: 0, [other.uid]: 0 },
    })
  }
  return id
}

export function listenConversations(
  uid: string,
  cb: (items: Conversation[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'conversations'),
    where('memberIds', 'array-contains', uid),
    orderBy('lastMessageAt', 'desc'),
    limit(40),
  )
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          memberIds: data.memberIds || [],
          memberNames: data.memberNames || {},
          memberAvatars: data.memberAvatars || {},
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt || 0,
          unread: data.unread || {},
        }
      }),
    )
  })
}

export function listenMessages(
  conversationId: string,
  cb: (items: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc'),
    limit(200),
  )
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          conversationId: data.conversationId,
          senderId: data.senderId,
          text: data.text || '',
          mediaUrl: data.mediaUrl,
          createdAt: data.createdAt || 0,
        }
      }),
    )
  })
}

export async function sendMessage(params: {
  conversationId: string
  sender: UserProfile
  text: string
  otherUid: string
  file?: File
}): Promise<void> {
  let mediaUrl: string | undefined
  if (params.file) {
    const blob = params.file.type.startsWith('image/')
      ? await compressImage(params.file, 1200, 0.8)
      : params.file
    const storageRef = ref(
      storage,
      `messages/${params.sender.uid}/${Date.now()}-${params.file.name}`,
    )
    await uploadBytes(storageRef, blob, { contentType: params.file.type })
    mediaUrl = await getDownloadURL(storageRef)
  }

  await addDoc(collection(db, 'messages'), {
    conversationId: params.conversationId,
    senderId: params.sender.uid,
    text: params.text.trim(),
    mediaUrl: mediaUrl || null,
    createdAt: Date.now(),
  })

  const convRef = doc(db, 'conversations', params.conversationId)
  const snap = await getDoc(convRef)
  const unread = { ...(snap.data()?.unread || {}) }
  unread[params.otherUid] = (unread[params.otherUid] || 0) + 1
  unread[params.sender.uid] = 0
  await updateDoc(convRef, {
    lastMessage: params.text.trim() || (mediaUrl ? 'Photo' : ''),
    lastMessageAt: Date.now(),
    unread,
  })
}

export async function clearUnread(conversationId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'conversations', conversationId), {
    [`unread.${uid}`]: 0,
  })
}
