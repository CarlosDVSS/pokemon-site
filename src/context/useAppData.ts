import { useContext } from 'react'
import { DataContext, type DataContextValue } from './dataContextDefinition'

export function useAppData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useAppData fora do DataProvider')
  return ctx
}
