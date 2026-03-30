import { useCallback, useEffect, useRef, useState } from 'react'
import type { Student, TaskScore } from '../db/types'
import { spriteUrlForDexId } from '../domain/evolution'
import { getPokemon } from '../domain/pokemon'
import { buildStandings } from '../domain/scores'

export type EvoEvent = {
  id: string
  fromUrl: string
  toUrl: string
  fromNamePt: string
  toNamePt: string
}

export function useEvolutionQueue(students: Student[], scores: TaskScore[]) {
  const [queue, setQueue] = useState<EvoEvent[]>([])
  const prev = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    const standings = buildStandings(students, scores)
    const adds: EvoEvent[] = []
    for (const row of standings) {
      const id = row.student.id
      const cur = row.stageIndex
      const before = prev.current.get(id)
      if (before === undefined) {
        prev.current.set(id, cur)
        continue
      }
      if (cur > before) {
        const def = getPokemon(row.student.pokemonKey)
        const chain = def?.evolutionChain ?? [1]
        const sn = def?.stageNamesPt
        const bi = Math.min(before, chain.length - 1)
        const ci = Math.min(cur, chain.length - 1)
        const fromDex = chain[bi] ?? chain[0]
        const toDex = chain[ci] ?? chain[0]
        adds.push({
          id: crypto.randomUUID(),
          fromUrl: spriteUrlForDexId(fromDex),
          toUrl: spriteUrlForDexId(toDex),
          fromNamePt: sn?.[bi] ?? '???',
          toNamePt: sn?.[ci] ?? '???',
        })
      }
      prev.current.set(id, cur)
    }
    if (adds.length > 0) {
      queueMicrotask(() => setQueue((q) => [...q, ...adds]))
    }
  }, [students, scores])

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), [])

  return { current: queue[0], dismiss }
}
