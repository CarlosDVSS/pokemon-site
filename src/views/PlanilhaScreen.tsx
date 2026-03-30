import { useCallback, useMemo, useState } from 'react'
import { playError, playMenuMove, resumeAudio } from '../audio/gameAudio'
import { useAppData } from '../context/useAppData'
import { getPokemon, stageNamePt } from '../domain/pokemon'
import { buildStandings, scoreForTask, totalPointsForStudent } from '../domain/scores'

export function PlanilhaScreen({ onBack }: { onBack: () => void }) {
  const { data, db } = useAppData()
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const standingsById = useMemo(() => {
    const st = buildStandings(data.students, data.scores)
    return new Map(st.map((r) => [r.student.id, r]))
  }, [data.students, data.scores])

  const tasksOrdered = useMemo(
    () => [...data.tasks].sort((a, b) => a.createdAt - b.createdAt),
    [data.tasks],
  )

  const studentsSorted = useMemo(
    () => [...data.students].sort((a, b) => a.name.localeCompare(b.name, 'pt')),
    [data.students],
  )

  const colCount = 4 + tasksOrdered.length

  const saveScore = useCallback(
    async (studentId: string, taskId: string, raw: string) => {
      setMsg(null)
      const task = data.tasks.find((t) => t.id === taskId)
      if (!task) return
      const n = raw === '' ? 0 : Number(raw)
      if (Number.isNaN(n) || n < 0) {
        playError()
        setMsg({ type: 'err', text: 'Valor inválido.' })
        return
      }
      if (n > task.maxPoints) {
        playError()
        setMsg({ type: 'err', text: `Máximo para «${task.title}»: ${task.maxPoints} pts.` })
        return
      }
      try {
        await db.setTaskScore(studentId, taskId, n)
        setMsg({ type: 'ok', text: 'Pontos salvos.' })
      } catch (err) {
        playError()
        setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao salvar.' })
      }
    },
    [data.tasks, db],
  )

  return (
    <section className="screen-wrap planilha-screen">
      <button
        type="button"
        className="btn-back"
        onClick={() => {
          void resumeAudio()
          playMenuMove()
          onBack()
        }}
      >
        ◀ Menu
      </button>
      <h2 className="section-title planilha-title">Planilha de desempenho</h2>
      {msg && <div className={`msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}

      <div className="planilha-table-wrap table-wrap">
        <table className="planilha-table">
          <colgroup>
            <col className="planilha-col-student" />
            <col className="planilha-col-species" />
            {tasksOrdered.map((t) => (
              <col key={t.id} className="planilha-col-task" />
            ))}
            <col className="planilha-col-total" />
            <col className="planilha-col-base" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="planilha-th-student">
                Aluno
              </th>
              <th scope="col" className="planilha-th-species">
                Pokémon
              </th>
              {tasksOrdered.map((t) => (
                <th key={t.id} scope="col" className="planilha-th-task">
                  <span className="planilha-th-tasktitle">{t.title}</span>
                </th>
              ))}
              <th scope="col" className="planilha-th-total">
                Total
              </th>
              <th scope="col" className="planilha-th-base">
                1º Pokémon
              </th>
            </tr>
          </thead>
          <tbody>
            {studentsSorted.length === 0 ? (
              <tr>
                <td colSpan={Math.max(colCount, 4)} className="planilha-empty">
                  Nenhum aluno cadastrado. Use Registros → Aluno.
                </td>
              </tr>
            ) : tasksOrdered.length === 0 ? (
              <tr>
                <td colSpan={Math.max(colCount, 4)} className="planilha-empty">
                  Nenhuma tarefa cadastrada. Use Registros → Tarefa.
                </td>
              </tr>
            ) : (
              studentsSorted.map((s, rowIdx) => {
                const row = standingsById.get(s.id)
                const pk = getPokemon(s.pokemonKey)
                const speciesNow =
                  row !== undefined
                    ? stageNamePt(s.pokemonKey, row.stageIndex)
                    : pk?.namePt ?? '—'
                const baseFirst = pk?.stageNamesPt[0] ?? pk?.namePt ?? '—'
                const total = totalPointsForStudent(data.scores, s.id)

                return (
                  <tr key={s.id} className={rowIdx % 2 === 0 ? 'planilha-row--zebra' : ''}>
                    <td className="planilha-name">{s.name.toLocaleUpperCase('pt-BR')}</td>
                    <td className="planilha-species">{speciesNow}</td>
                    {tasksOrdered.map((t) => {
                      const cur = scoreForTask(data.scores, s.id, t.id) ?? ''
                      return (
                        <td key={t.id} className="planilha-num">
                          <input
                            className="planilha-input"
                            type="number"
                            min={0}
                            max={t.maxPoints}
                            step={1}
                            defaultValue={cur === '' ? '' : String(cur)}
                            aria-label={`${s.name} — ${t.title}`}
                            onBlur={(e) => {
                              void resumeAudio()
                              void saveScore(s.id, t.id, e.target.value)
                            }}
                          />
                        </td>
                      )
                    })}
                    <td className="planilha-total">{total}</td>
                    <td className="planilha-base">{baseFirst}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
