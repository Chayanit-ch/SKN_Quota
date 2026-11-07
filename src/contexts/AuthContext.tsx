import { type User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { auth, db, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { readJSON, subscribe, writeJSON } from '../lib/mockStore'
import type { AppUser } from '../types/firestore'

interface AuthState {
  uid: string | null
  profile: AppUser | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

// Dev-only stand-in for Firebase Auth, active only when VITE_FIREBASE_* isn't set, so /staff
// and /admin can be exercised locally without a real project. Never used once configured.
const MOCK_AUTH_KEY = 'mock:auth'
interface MockAuthState {
  signedIn: boolean
  role: 'admin' | 'staff'
}
const DEFAULT_MOCK_AUTH: MockAuthState = { signedIn: true, role: 'admin' }

export function setMockRole(role: 'admin' | 'staff') {
  writeJSON(MOCK_AUTH_KEY, { ...readJSON(MOCK_AUTH_KEY, DEFAULT_MOCK_AUTH), role })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [mockAuth, setMockAuth] = useState<MockAuthState>(DEFAULT_MOCK_AUTH)

  useEffect(() => {
    if (isFirebaseConfigured) return
    const emit = () => setMockAuth(readJSON(MOCK_AUTH_KEY, DEFAULT_MOCK_AUTH))
    emit()
    return subscribe(MOCK_AUTH_KEY, emit)
  }, [])

  useEffect(() => {
    const authInstance = auth
    const dbInstance = db
    if (!authInstance || !dbInstance) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
      setError(null)
      if (!firebaseUser?.email) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }
      try {
        // `users/{email}` must be pre-created by an administrator — signing in with Google
        // alone never grants access. See firestore.rules.
        const snap = await getDoc(doc(dbInstance, 'users', firebaseUser.email.toLowerCase()))
        if (!snap.exists()) {
          setError('บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ')
          await firebaseSignOut(authInstance)
          setUser(null)
          setProfile(null)
        } else {
          setUser(firebaseUser)
          setProfile(snap.data() as AppUser)
        }
      } catch (e) {
        console.error('[AuthProvider]', e)
        setError('ไม่สามารถตรวจสอบสิทธิ์ได้ กรุณาลองใหม่อีกครั้ง')
        setUser(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsubscribe
  }, [])

  async function signIn() {
    if (!auth) {
      writeJSON(MOCK_AUTH_KEY, { ...mockAuth, signedIn: true })
      return
    }
    setError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (e) {
      console.error('[AuthProvider] signIn', e)
      setError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    }
  }

  async function signOut() {
    if (!auth) {
      writeJSON(MOCK_AUTH_KEY, { ...mockAuth, signedIn: false })
      return
    }
    await firebaseSignOut(auth)
  }

  const uid = isFirebaseConfigured ? (user?.uid ?? null) : mockAuth.signedIn ? 'mock-user' : null
  const effectiveProfile: AppUser | null = isFirebaseConfigured
    ? profile
    : mockAuth.signedIn
      ? {
          email: 'mock@sknb.ac.th',
          name: mockAuth.role === 'admin' ? 'ผู้ดูแลระบบ (โหมดทดสอบ)' : 'ครู (โหมดทดสอบ)',
          role: mockAuth.role,
        }
      : null

  return (
    <AuthContext.Provider
      value={{ uid, profile: effectiveProfile, loading, error, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
