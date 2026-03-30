import type { Student, TaskScore } from '../db/types'
import { getPokemon } from './pokemon'
import { evolutionStageIndex, spriteUrlForDexId } from './evolution'

export function totalPointsForStudent(scores: TaskScore[], studentId: string): number {
  return scores.filter((s) => s.studentId === studentId).reduce((a, s) => a + s.points, 0)
}

export function scoreForTask(
  scores: TaskScore[],
  studentId: string,
  taskId: string,
): number | undefined {
  const row = scores.find((s) => s.studentId === studentId && s.taskId === taskId)
  return row?.points
}

export type StudentStanding = {
  student: Student
  total: number
  stageIndex: number
  spriteUrl: string
}

export function buildStandings(students: Student[], scores: TaskScore[]): StudentStanding[] {
  return students.map((student) => {
    const total = totalPointsForStudent(scores, student.id)
    const def = getPokemon(student.pokemonKey)
    const chain = def?.evolutionChain ?? [1]
    const stageIndex = evolutionStageIndex(total, chain.length)
    const dexId = chain[stageIndex] ?? chain[0]
    return {
      student,
      total,
      stageIndex,
      spriteUrl: spriteUrlForDexId(dexId),
    }
  })
}

export function sortByTotalDesc(standings: StudentStanding[]): StudentStanding[] {
  return [...standings].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total
    return a.student.name.localeCompare(b.student.name, 'pt')
  })
}
