import type { AppData, DatabaseApi, Student, Task, TaskScore, Team } from './types'
import { getPokemon } from '../domain/pokemon'
import { isValidMatricula7, matriculaErrorMessage } from '../domain/matricula'

const LS_KEY = 'placar-pokemon-data-v2'
const LS_LEGACY = 'placar-pokemon-data-v1'
const CHANNEL = 'placar-pokemon-sync'

function emptyData(): AppData {
  return { students: [], tasks: [], scores: [], teams: [] }
}

function migrateTask(raw: Record<string, unknown>): Task {
  return {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    maxPoints: Math.max(0, Number(raw.maxPoints ?? 100)),
    createdAt: Number(raw.createdAt ?? Date.now()),
  }
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) {
      const old = localStorage.getItem(LS_LEGACY)
      if (old) {
        const parsed = JSON.parse(old) as {
          students?: Student[]
          tasks?: Array<Record<string, unknown>>
          scores?: TaskScore[]
        }
        const tasks = (parsed.tasks ?? []).map((t) =>
          migrateTask({ ...t, maxPoints: (t as { maxPoints?: number }).maxPoints ?? 100 }),
        )
        const next: AppData = {
          students: parsed.students ?? [],
          tasks,
          scores: parsed.scores ?? [],
          teams: [],
        }
        localStorage.setItem(LS_KEY, JSON.stringify(next))
        return next
      }
    }
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.students || !parsed.tasks || !parsed.scores) return emptyData()
    return {
      students: parsed.students,
      tasks: parsed.tasks.map((t) =>
        typeof (t as Task).maxPoints === 'number' ? t : migrateTask(t as unknown as Record<string, unknown>),
      ),
      scores: parsed.scores,
      teams: parsed.teams ?? [],
    }
  } catch {
    return emptyData()
  }
}

function save(data: AppData): void {
  localStorage.setItem(LS_KEY, JSON.stringify(data))
  try {
    const ch = new BroadcastChannel(CHANNEL)
    ch.postMessage({ t: 'sync' })
    ch.close()
  } catch {
    /* ignore */
  }
}

function matriculaKey(s: string): string {
  return s.trim()
}

export function createLocalDatabase(): DatabaseApi {
  let data = load()
  const listeners = new Set<(d: AppData) => void>()

  const notify = () => {
    const snap: AppData = {
      students: [...data.students],
      tasks: [...data.tasks],
      scores: [...data.scores],
      teams: [...data.teams],
    }
    listeners.forEach((l) => l(snap))
  }

  notify()

  try {
    const bc = new BroadcastChannel(CHANNEL)
    bc.onmessage = () => {
      data = load()
      notify()
    }
  } catch {
    /* ignore */
  }

  window.addEventListener('storage', (e) => {
    if (e.key === LS_KEY) {
      data = load()
      notify()
    }
  })

  return {
    mode: 'local',
    subscribe(listener) {
      listeners.add(listener)
      listener({
        students: [...data.students],
        tasks: [...data.tasks],
        scores: [...data.scores],
        teams: [...data.teams],
      })
      return () => listeners.delete(listener)
    },
    async addStudent(name, matricula, pokemonKey) {
      const m = matricula.trim()
      if (!name.trim() || !m) throw new Error('Nome e matrícula são obrigatórios.')
      if (!isValidMatricula7(m)) throw new Error(matriculaErrorMessage())
      if (!getPokemon(pokemonKey)) throw new Error('Pokémon inválido.')
      const taken = data.students.some((s) => matriculaKey(s.matricula) === matriculaKey(m))
      if (taken) throw new Error('Matrícula já cadastrada.')

      const student: Student = {
        id: crypto.randomUUID(),
        name: name.trim(),
        matricula: m,
        pokemonKey,
        createdAt: Date.now(),
      }
      data = { ...data, students: [...data.students, student] }
      save(data)
      notify()
    },
    async updateStudent(studentId, fields) {
      const m = fields.matricula.trim()
      const nm = fields.name.trim()
      if (!nm || !m) throw new Error('Nome e matrícula são obrigatórios.')
      if (!isValidMatricula7(m)) throw new Error(matriculaErrorMessage())
      if (!getPokemon(fields.pokemonKey)) throw new Error('Pokémon inválido.')
      const taken = data.students.some(
        (s) => s.id !== studentId && matriculaKey(s.matricula) === matriculaKey(m),
      )
      if (taken) throw new Error('Matrícula já cadastrada.')
      data = {
        ...data,
        students: data.students.map((s) =>
          s.id === studentId ? { ...s, name: nm, matricula: m, pokemonKey: fields.pokemonKey } : s,
        ),
      }
      save(data)
      notify()
    },
    async deleteStudent(studentId) {
      data = {
        ...data,
        students: data.students.filter((s) => s.id !== studentId),
        scores: data.scores.filter((s) => s.studentId !== studentId),
        teams: data.teams.map((t) => ({
          ...t,
          studentIds: t.studentIds.filter((id) => id !== studentId),
        })),
      }
      save(data)
      notify()
    },
    async addTask(title, maxPoints) {
      const t = title.trim()
      if (!t) throw new Error('Título da tarefa é obrigatório.')
      if (!Number.isFinite(maxPoints) || maxPoints < 0) throw new Error('Valor da tarefa inválido.')
      const task: Task = {
        id: crypto.randomUUID(),
        title: t,
        maxPoints,
        createdAt: Date.now(),
      }
      data = { ...data, tasks: [...data.tasks, task] }
      save(data)
      notify()
    },
    async updateTask(taskId, fields) {
      const t = fields.title.trim()
      if (!t) throw new Error('Título da tarefa é obrigatório.')
      if (!Number.isFinite(fields.maxPoints) || fields.maxPoints < 0) {
        throw new Error('Valor da tarefa inválido.')
      }
      const task = data.tasks.find((x) => x.id === taskId)
      if (!task) throw new Error('Tarefa não encontrada.')
      const bad = data.scores.some((s) => s.taskId === taskId && s.points > fields.maxPoints)
      if (bad) {
        throw new Error('Existem notas acima do novo máximo. Ajuste as notas antes.')
      }
      data = {
        ...data,
        tasks: data.tasks.map((x) =>
          x.id === taskId ? { ...x, title: t, maxPoints: fields.maxPoints } : x,
        ),
      }
      save(data)
      notify()
    },
    async deleteTask(taskId) {
      data = {
        ...data,
        tasks: data.tasks.filter((t) => t.id !== taskId),
        scores: data.scores.filter((s) => s.taskId !== taskId),
      }
      save(data)
      notify()
    },
    async setTaskScore(studentId, taskId, points) {
      if (points < 0 || !Number.isFinite(points)) throw new Error('Pontos inválidos.')
      const task = data.tasks.find((t) => t.id === taskId)
      if (!task) throw new Error('Tarefa não encontrada.')
      if (points > task.maxPoints) {
        throw new Error(`Máximo nesta tarefa: ${task.maxPoints} pts.`)
      }
      const idx = data.scores.findIndex((s) => s.studentId === studentId && s.taskId === taskId)
      const row: TaskScore = {
        studentId,
        taskId,
        points,
        updatedAt: Date.now(),
      }
      const scores =
        idx === -1 ? [...data.scores, row] : data.scores.map((s, i) => (i === idx ? row : s))
      data = { ...data, scores }
      save(data)
      notify()
    },
    async addTeam(name) {
      const n = name.trim()
      if (!n) throw new Error('Nome da equipe é obrigatório.')
      const team: Team = {
        id: crypto.randomUUID(),
        name: n,
        studentIds: [],
        createdAt: Date.now(),
      }
      data = { ...data, teams: [...data.teams, team] }
      save(data)
      notify()
    },
    async setTeamMembers(teamId, studentIds) {
      const set = new Set(studentIds)
      data = {
        ...data,
        teams: data.teams.map((t) => (t.id === teamId ? { ...t, studentIds: [...set] } : t)),
      }
      save(data)
      notify()
    },
    async deleteTeam(teamId) {
      data = { ...data, teams: data.teams.filter((t) => t.id !== teamId) }
      save(data)
      notify()
    },
  }
}
