import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { ensureUserProfile, getUserProfile } from '../lib/api'
import { isCorporateEmail, type UserProfile } from '../lib/types'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  refreshProfile: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null)
      return
    }
    const p = await getUserProfile(auth.currentUser.uid)
    setProfile(p)
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          if (!isCorporateEmail(u.email)) {
            await signOut(auth)
            setProfile(null)
            setLoading(false)
            return
          }
          const p = await ensureUserProfile(
            u.uid,
            u.email || '',
            u.displayName || u.email?.split('@')[0] || 'CSG',
          )
          setProfile(p)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    if (!isCorporateEmail(email)) {
      throw new Error('Use your @csgi.com or @csg.com email')
    }
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }, [])

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (!isCorporateEmail(email)) {
        throw new Error('Use your @csgi.com or @csg.com email')
      }
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      await updateProfile(cred.user, { displayName: displayName.trim() })
      await ensureUserProfile(cred.user.uid, email.trim(), displayName.trim())
    },
    [],
  )

  const logout = useCallback(async () => {
    await signOut(auth)
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      refreshProfile,
      login,
      register,
      logout,
    }),
    [user, profile, loading, refreshProfile, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
