import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import type { AppUser } from '../types/firestore'
import { db } from './firebase'
import { readJSON, subscribe, writeJSON } from './mockStore'

const MOCK_KEY = 'mock:users'

export function subscribeUsers(onChange: (users: AppUser[]) => void) {
  if (db) {
    return onSnapshot(collection(db, 'users'), (snap) => onChange(snap.docs.map((d) => d.data() as AppUser)))
  }
  const emit = () => onChange(readJSON<AppUser[]>(MOCK_KEY, []))
  emit()
  return subscribe(MOCK_KEY, emit)
}

export async function saveUser(user: AppUser) {
  const email = user.email.toLowerCase().trim()
  const record: AppUser = { ...user, email }
  if (db) {
    await setDoc(doc(db, 'users', email), record)
    return
  }
  const current = readJSON<AppUser[]>(MOCK_KEY, [])
  const next = current.some((u) => u.email === email) ? current.map((u) => (u.email === email ? record : u)) : [...current, record]
  writeJSON(MOCK_KEY, next)
}

export async function deleteUser(email: string) {
  const normalized = email.toLowerCase().trim()
  if (db) {
    await deleteDoc(doc(db, 'users', normalized))
    return
  }
  writeJSON(MOCK_KEY, readJSON<AppUser[]>(MOCK_KEY, []).filter((u) => u.email !== normalized))
}
