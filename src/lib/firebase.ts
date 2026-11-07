import { type FirebaseApp, getApps, initializeApp } from 'firebase/app'
import { type Auth, GoogleAuthProvider, getAuth } from 'firebase/auth'
import { type Firestore, getFirestore } from 'firebase/firestore'
import { type Functions, getFunctions } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

/**
 * True once real Firebase project credentials are supplied via env vars (see .env.example).
 * Without them, pages fall back to local seed data so the UI remains usable during development.
 */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let functions: Functions | undefined

if (isFirebaseConfigured) {
  app = getApps()[0] ?? initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
  functions = getFunctions(app)
} else {
  console.warn(
    '[firebase] ยังไม่ได้ตั้งค่า VITE_FIREBASE_* ในไฟล์ .env — หน้าที่ต้องเชื่อมต่อฐานข้อมูลจะใช้ข้อมูลตัวอย่างในเครื่องแทน',
  )
}

export { app, db, auth, functions }
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ hd: '*' })
