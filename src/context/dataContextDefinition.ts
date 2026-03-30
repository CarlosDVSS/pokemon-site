import { createContext } from 'react'
import type { AppData, DatabaseApi } from '../db'

export type DataContextValue = {
  data: AppData
  mode: 'local' | 'firebase'
  db: DatabaseApi
}

export const DataContext = createContext<DataContextValue | null>(null)
