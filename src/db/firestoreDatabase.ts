import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore'
import type { FirebaseApp } from 'firebase/app'
import type { AppData, DatabaseApi, Student, Task, TaskScore, Team } from './types'
import { getPokemon } from '../domain/pokemon'
import { isValidMatricula7, matriculaErrorMessage } from '../domain/matricula'

function matriculaKey(s: string): string {
  return s.trim()
}

function tsToMs(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as Timestamp).toMillis === 'function') {
    return (v as Timestamp).toMillis()
  }
  if (typeof v === 'number') return v
  return Date.now()
}

function mapTask(d: { id: string; data: () => Record<string, unknown> }): Task {
  const x = d.data()
  return {
    id: d.id,
    title: String(x.title ?? ''),
    maxPoints: Math.max(0, Number(x.maxPoints ?? 100)),
    createdAt: tsToMs(x.createdAt),
  }
}

function mapTeam(d: { id: string; data: () => Record<string, unknown> }): Team {
  const x = d.data()
  const ids = x.studentIds
  return {
    id: d.id,
    name: String(x.name ?? ''),
    studentIds: Array.isArray(ids) ? ids.map(String) : [],
    createdAt: tsToMs(x.createdAt),
  }
}

export function createFirestoreDatabase(app: FirebaseApp): DatabaseApi {
  const db = getFirestore(app)
  let students: Student[] = []
  let tasks: Task[] = []
  let scores: TaskScore[] = []
  let teams: Team[] = []
  const listeners = new Set<(d: AppData) => void>()

  const push = () => {
    const snap: AppData = {
      students: [...students],
      tasks: [...tasks],
      scores: [...scores],
      teams: [...teams],
    }
    listeners.forEach((l) => l(snap))
  }

  onSnapshot(query(collection(db, 'students'), orderBy('createdAt', 'asc')), (snap) => {
    students = snap.docs.map((d) => {
      const x = d.data() as Record<string, unknown>
      return {
        id: d.id,
        name: String(x.name ?? ''),
        matricula: String(x.matricula ?? ''),
        pokemonKey: String(x.pokemonKey ?? ''),
        createdAt: tsToMs(x.createdAt),
      }
    })
    push()
  })

  onSnapshot(query(collection(db, 'tasks'), orderBy('createdAt', 'asc')), (snap) => {
    tasks = snap.docs.map((d) => mapTask(d))
    push()
  })

  onSnapshot(collection(db, 'taskScores'), (snap) => {
    scores = snap.docs.map((d) => {
      const x = d.data() as Record<string, unknown>
      return {
        studentId: String(x.studentId ?? ''),
        taskId: String(x.taskId ?? ''),
        points: Number(x.points ?? 0),
        updatedAt: tsToMs(x.updatedAt),
      }
    })
    push()
  })

  onSnapshot(query(collection(db, 'teams'), orderBy('createdAt', 'asc')), (snap) => {
    teams = snap.docs.map((d) => mapTeam(d))
    push()
  })

  return {
    mode: 'firebase',
    subscribe(listener) {
      listeners.add(listener)
      listener({
        students: [...students],
        tasks: [...tasks],
        scores: [...scores],
        teams: [...teams],
      })
      return () => {
        listeners.delete(listener)
      }
    },
    async addStudent(name, matricula, pokemonKey) {
      const m = matricula.trim()
      if (!name.trim() || !m) throw new Error('Nome e matrícula são obrigatórios.')
      if (!isValidMatricula7(m)) throw new Error(matriculaErrorMessage())
      if (!getPokemon(pokemonKey)) throw new Error('Pokémon inválido.')

      const snap = await getDocs(collection(db, 'students'))
      const taken = snap.docs.some((d) => matriculaKey(String(d.data().matricula ?? '')) === matriculaKey(m))
      if (taken) throw new Error('Matrícula já cadastrada.')

      await addDoc(collection(db, 'students'), {
        name: name.trim(),
        matricula: m,
        pokemonKey,
        createdAt: new Date(),
      })
    },
    async updateStudent(studentId, fields) {
      const m = fields.matricula.trim()
      const nm = fields.name.trim()
      if (!nm || !m) throw new Error('Nome e matrícula são obrigatórios.')
      if (!isValidMatricula7(m)) throw new Error(matriculaErrorMessage())
      if (!getPokemon(fields.pokemonKey)) throw new Error('Pokémon inválido.')
      const snap = await getDocs(collection(db, 'students'))
      const taken = snap.docs.some(
        (d) => d.id !== studentId && matriculaKey(String(d.data().matricula ?? '')) === matriculaKey(m),
      )
      if (taken) throw new Error('Matrícula já cadastrada.')
      await updateDoc(doc(db, 'students', studentId), {
        name: nm,
        matricula: m,
        pokemonKey: fields.pokemonKey,
      })
    },
    async deleteStudent(studentId) {
      const scoreSnap = await getDocs(collection(db, 'taskScores'))
      await Promise.all(
        scoreSnap.docs
          .filter((d) => (d.data() as { studentId?: string }).studentId === studentId)
          .map((d) => deleteDoc(d.ref)),
      )
      const teamSnap = await getDocs(collection(db, 'teams'))
      await Promise.all(
        teamSnap.docs.map(async (d) => {
          const x = d.data() as { studentIds?: string[] }
          const ids = Array.isArray(x.studentIds) ? x.studentIds.filter((id) => id !== studentId) : []
          if (ids.length !== (x.studentIds?.length ?? 0)) {
            await updateDoc(d.ref, { studentIds: ids })
          }
        }),
      )
      await deleteDoc(doc(db, 'students', studentId))
    },
    async addTask(title, maxPoints) {
      const t = title.trim()
      if (!t) throw new Error('Título da tarefa é obrigatório.')
      if (!Number.isFinite(maxPoints) || maxPoints < 0) throw new Error('Valor da tarefa inválido.')
      await addDoc(collection(db, 'tasks'), {
        title: t,
        maxPoints,
        createdAt: new Date(),
      })
    },
    async updateTask(taskId, fields) {
      const t = fields.title.trim()
      if (!t) throw new Error('Título da tarefa é obrigatório.')
      if (!Number.isFinite(fields.maxPoints) || fields.maxPoints < 0) {
        throw new Error('Valor da tarefa inválido.')
      }
      const scoreSnap = await getDocs(collection(db, 'taskScores'))
      const bad = scoreSnap.docs.some((d) => {
        const x = d.data() as { taskId?: string; points?: number }
        return x.taskId === taskId && Number(x.points ?? 0) > fields.maxPoints
      })
      if (bad) {
        throw new Error('Existem notas acima do novo máximo. Ajuste as notas antes.')
      }
      await updateDoc(doc(db, 'tasks', taskId), { title: t, maxPoints: fields.maxPoints })
    },
    async deleteTask(taskId) {
      const scoreSnap = await getDocs(collection(db, 'taskScores'))
      await Promise.all(
        scoreSnap.docs
          .filter((d) => (d.data() as { taskId?: string }).taskId === taskId)
          .map((d) => deleteDoc(d.ref)),
      )
      await deleteDoc(doc(db, 'tasks', taskId))
    },
    async setTaskScore(studentId, taskId, points) {
      if (points < 0 || !Number.isFinite(points)) throw new Error('Pontos inválidos.')
      const tref = doc(db, 'tasks', taskId)
      const ts = await getDoc(tref)
      if (!ts.exists()) throw new Error('Tarefa não encontrada.')
      const mp = Math.max(0, Number(ts.data()?.maxPoints ?? 100))
      if (points > mp) throw new Error(`Máximo nesta tarefa: ${mp} pts.`)
      const id = `${studentId}__${taskId}`.replace(/\//g, '_')
      await setDoc(doc(db, 'taskScores', id), {
        studentId,
        taskId,
        points,
        updatedAt: new Date(),
      })
    },
    async addTeam(name) {
      const n = name.trim()
      if (!n) throw new Error('Nome da equipe é obrigatório.')
      await addDoc(collection(db, 'teams'), {
        name: n,
        studentIds: [],
        createdAt: new Date(),
      })
    },
    async setTeamMembers(teamId, studentIds) {
      await updateDoc(doc(db, 'teams', teamId), { studentIds })
    },
    async deleteTeam(teamId) {
      await deleteDoc(doc(db, 'teams', teamId))
    },
  }
}
