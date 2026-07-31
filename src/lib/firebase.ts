import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'REPLACE_ME',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'csg-celebrate.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'csg-celebrate',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'csg-celebrate.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:replace',
}

export const isFirebaseConfigured =
  Boolean(import.meta.env.VITE_FIREBASE_API_KEY) &&
  import.meta.env.VITE_FIREBASE_API_KEY !== 'REPLACE_ME'

export const app: FirebaseApp = initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
export const storage: FirebaseStorage = getStorage(app)
