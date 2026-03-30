import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createDatabase, type AppData } from '../db'
import { DataContext } from './dataContextDefinition'

export function DataProvider({ children }: { children: ReactNode }) {
  const [db] = useState(() => createDatabase())
  const [data, setData] = useState<AppData>({
    students: [],
    tasks: [],
    scores: [],
    teams: [],
  })

  useEffect(() => db.subscribe(setData), [db])

  const value = useMemo(
    () => ({
      data,
      mode: db.mode,
      db,
    }),
    [data, db],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
