export type Student = {
  id: string
  name: string
  matricula: string
  pokemonKey: string
  createdAt: number
}

export type Task = {
  id: string
  title: string
  maxPoints: number
  createdAt: number
}

export type TaskScore = {
  studentId: string
  taskId: string
  points: number
  updatedAt: number
}

export type Team = {
  id: string
  name: string
  studentIds: string[]
  createdAt: number
}

export type AppData = {
  students: Student[]
  tasks: Task[]
  scores: TaskScore[]
  teams: Team[]
}

export type DbMode = 'local' | 'firebase'

export type DatabaseApi = {
  mode: DbMode
  subscribe: (listener: (data: AppData) => void) => () => void
  addStudent: (name: string, matricula: string, pokemonKey: string) => Promise<void>
  updateStudent: (
    studentId: string,
    fields: { name: string; matricula: string; pokemonKey: string },
  ) => Promise<void>
  deleteStudent: (studentId: string) => Promise<void>
  addTask: (title: string, maxPoints: number) => Promise<void>
  updateTask: (taskId: string, fields: { title: string; maxPoints: number }) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  setTaskScore: (studentId: string, taskId: string, points: number) => Promise<void>
  addTeam: (name: string) => Promise<void>
  setTeamMembers: (teamId: string, studentIds: string[]) => Promise<void>
  deleteTeam: (teamId: string) => Promise<void>
}
