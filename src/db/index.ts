import type { DatabaseApi } from './types'
import { getOrInitFirebaseApp, isFirebaseConfigured } from './firebaseConfig'
import { createLocalDatabase } from './localDatabase'
import { createFirestoreDatabase } from './firestoreDatabase'

export type { AppData, DatabaseApi, Student, Task, TaskScore, Team } from './types'

export function createDatabase(): DatabaseApi {
  if (isFirebaseConfigured()) {
    const app = getOrInitFirebaseApp()
    if (app) return createFirestoreDatabase(app)
  }
  return createLocalDatabase()
}
