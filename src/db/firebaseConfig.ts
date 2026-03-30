import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'

type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function readConfig(): FirebaseWebConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? ''
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? ''
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? ''
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? ''
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? ''
  const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? ''
  if (!apiKey || !projectId || !appId) return null
  return {
    apiKey,
    authDomain: authDomain || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId: messagingSenderId || '0',
    appId,
  }
}

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null
}

export function getOrInitFirebaseApp(): FirebaseApp | null {
  const cfg = readConfig()
  if (!cfg) return null
  if (getApps().length > 0) return getApps()[0]
  return initializeApp(cfg)
}
