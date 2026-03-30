import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { playClick, playConfirm, playError, playMenuMove, resumeAudio } from '../audio/gameAudio'
import { useAppData } from '../context/useAppData'
import { clampMatriculaInput, isValidMatricula7, matriculaErrorMessage } from '../domain/matricula'
import {
  POKEMON_LIST,
  TYPE_LABELS_PT,
  getPokemon,
  primaryType,
  typesLabelPlacar,
} from '../domain/pokemon'
import {
  buildStandings,
  scoreForTask,
  sortByTotalDesc,
  totalPointsForStudent,
} from '../domain/scores'
import type { StudentStanding } from '../domain/scores'
import type { Student, Task, Team } from '../db/types'

export type RootScreen = 'home' | 'placar' | 'equipes' | 'registrar' | 'lista' | 'planilha'

export { PlanilhaScreen } from './PlanilhaScreen'

export function GbaHome({
  onPlacar,
  onRegistrar,
  onEquipes,
  onLista,
  onPlanilha,
}: {
  onPlacar: () => void
  onRegistrar: () => void
  onEquipes: () => void
  onLista: () => void
  onPlanilha: () => void
}) {
  return (
    <div className="gba-home-scene">
      <div className="gba-mold gba-mold--home">
        <div className="gba-mold-brand">GAME BOY ADVANCE</div>
        <div className="gba-lcd-bezel">
          <div className="gba-lcd-glass">
            <div className="gba-boot-screen">
              <h1 className="gba-boot-title">PLACAR POKéMON</h1>
              <p className="gba-boot-sub">Edição Uespi</p>
              <p className="gba-boot-hint">Botões na carcaça</p>
            </div>
          </div>
        </div>
        <div className="gba-faceplate">
          <div className="gba-btn-row">
            <button type="button" className="gba-pad-btn gba-btn-placar" onClick={onPlacar}>
              PLACAR
            </button>
            <button type="button" className="gba-play-circle" onClick={onRegistrar} aria-label="Registros">
              <span className="gba-play-tri">▶</span>
              <span className="gba-play-label">REGISTROS</span>
            </button>
            <button type="button" className="gba-pad-btn gba-btn-team" onClick={onEquipes}>
              EQUIPES
            </button>
          </div>
          <div className="gba-home-wide-row">
            <button type="button" className="gba-lista-wide gba-lista-wide--half" onClick={onLista}>
              LISTA GERAL
            </button>
            <button type="button" className="gba-lista-wide gba-lista-wide--half gba-planilha-wide" onClick={onPlanilha}>
              PLANILHA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Voltar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="btn-back"
      onClick={() => {
        void resumeAudio()
        playMenuMove()
        onClick()
      }}
    >
      ◀ Menu
    </button>
  )
}

function PokedexCard({ row, rank }: { row: StudentStanding; rank: number }) {
  const pk = getPokemon(row.student.pokemonKey)
  const chain = pk?.evolutionChain.length ?? 1
  const species = pk?.stageNamesPt[row.stageIndex] ?? '—'
  return (
    <article className="pokedex-card">
      <header className="pokedex-head">
        <span className="pokedex-rank">#{rank}</span>
        <span className="pokedex-student">{row.student.name}</span>
        <span className="pokedex-mat">{row.student.matricula}</span>
      </header>
      <div className="pokedex-main">
        <div className="pokedex-art">
          <img src={row.spriteUrl} alt="" width={96} height={96} loading="lazy" />
        </div>
        <dl className="pokedex-dl">
          <dt>ESPÉCIE</dt>
          <dd>{species}</dd>
          <dt>TIPO</dt>
          <dd className="pokedex-types">{pk ? typesLabelPlacar(pk.types) : '—'}</dd>
          <dt>PONTOS</dt>
          <dd className="pokedex-pts">{row.total}</dd>
          <dt>EVOL.</dt>
          <dd>
            Fase {row.stageIndex + 1}/{chain}
          </dd>
        </dl>
      </div>
    </article>
  )
}

function TeamSpriteStrip({ studentIds, allStandings }: { studentIds: string[]; allStandings: StudentStanding[] }) {
  const byId = useMemo(() => new Map(allStandings.map((r) => [r.student.id, r])), [allStandings])
  if (studentIds.length === 0) return null
  return (
    <div className="team-strip" aria-hidden>
      {studentIds.map((id) => {
        const row = byId.get(id)
        if (!row) return null
        return <img key={id} src={row.spriteUrl} alt="" className="team-strip-sprite" width={40} height={40} />
      })}
    </div>
  )
}

export function PlacarScreen({ onBack }: { onBack: () => void }) {
  const { data } = useAppData()
  const [sub, setSub] = useState<'geral' | 'tipo' | 'equipe'>('geral')
  const standings = useMemo(
    () => sortByTotalDesc(buildStandings(data.students, data.scores)),
    [data.students, data.scores],
  )

  const types = useMemo(() => {
    const set = new Set<string>()
    for (const s of data.students) {
      const t = primaryType(s.pokemonKey)
      if (t) set.add(t)
    }
    return [...set].sort((a, b) =>
      (TYPE_LABELS_PT[a] ?? a).localeCompare(TYPE_LABELS_PT[b] ?? b, 'pt'),
    )
  }, [data.students])

  const [typeKey, setTypeKey] = useState('')
  const selectedType = typeKey || types[0] || ''

  const [teamId, setTeamId] = useState('')
  const selectedTeam = data.teams.find((t) => t.id === teamId) ?? data.teams[0]
  const effectiveTeamId = teamId || data.teams[0]?.id || ''

  const byType = useMemo(() => {
    if (!selectedType) return standings
    return standings.filter((row) => primaryType(row.student.pokemonKey) === selectedType)
  }, [standings, selectedType])

  const byEquipe = useMemo(() => {
    const team = data.teams.find((t) => t.id === effectiveTeamId)
    if (!team) return []
    const set = new Set(team.studentIds)
    return sortByTotalDesc(standings.filter((row) => set.has(row.student.id)))
  }, [standings, data.teams, effectiveTeamId])

  const list =
    sub === 'geral' ? standings : sub === 'tipo' ? byType : byEquipe

  const showTeamBanner = sub === 'equipe' && selectedTeam && selectedTeam.studentIds.length > 0

  return (
    <section className="screen-wrap">
      <Voltar onClick={onBack} />
      <h2 className="section-title pokedex-screen-title">Pokédex — Placar</h2>
      <div className="subnav subnav-3">
        <button
          type="button"
          className={sub === 'geral' ? 'active' : ''}
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setSub('geral')
          }}
        >
          Geral
        </button>
        <button
          type="button"
          className={sub === 'tipo' ? 'active' : ''}
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setSub('tipo')
          }}
        >
          Por tipo
        </button>
        <button
          type="button"
          className={sub === 'equipe' ? 'active' : ''}
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setSub('equipe')
          }}
        >
          Por equipe
        </button>
      </div>
      {sub === 'tipo' && data.students.length > 0 && (
        <div className="field">
          <label htmlFor="tpf">Tipo</label>
          <select id="tpf" value={selectedType} onChange={(e) => setTypeKey(e.target.value)}>
            {types.map((t) => (
              <option key={t} value={t}>
                {(TYPE_LABELS_PT[t] ?? t).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
      )}
      {sub === 'equipe' && (
        <div className="field">
          <label htmlFor="eqpl">Equipe</label>
          <select
            id="eqpl"
            value={effectiveTeamId}
            onChange={(e) => setTeamId(e.target.value)}
          >
            {data.teams.length === 0 && <option value="">—</option>}
            {data.teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.studentIds.length} membros)
              </option>
            ))}
          </select>
        </div>
      )}
      {showTeamBanner && selectedTeam && (
        <div className="placar-team-banner">
          <div className="placar-team-title">Equipe {selectedTeam.name}</div>
          <TeamSpriteStrip studentIds={selectedTeam.studentIds} allStandings={standings} />
        </div>
      )}
      {sub === 'equipe' && data.teams.length === 0 ? (
        <p className="hint">Crie equipes em EQUIPES para ver o placar por time.</p>
      ) : list.length === 0 ? (
        <p className="hint">Nada a exibir ainda (ou equipe vazia).</p>
      ) : (
        <div className="pokedex-list">
          {list.map((row, i) => (
            <PokedexCard key={row.student.id} row={row} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  )
}

const TEAM_ACCENTS = ['#c02020', '#2060c0', '#208040', '#a060c0', '#c08020', '#407878'] as const

export function EquipesScreen({ onBack }: { onBack: () => void }) {
  const { data, db } = useAppData()
  const [newName, setNewName] = useState('')
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const activeTeamId = useMemo(() => {
    if (data.teams.length === 0) return ''
    if (pickedId && data.teams.some((t) => t.id === pickedId)) return pickedId
    return data.teams[0]!.id
  }, [data.teams, pickedId])

  const team = data.teams.find((t) => t.id === activeTeamId)
  const standings = useMemo(
    () => buildStandings(data.students, data.scores),
    [data.students, data.scores],
  )
  const spriteByStudent = useMemo(() => new Map(standings.map((r) => [r.student.id, r.spriteUrl])), [standings])

  const toggleStudent = async (studentId: string) => {
    if (!team) return
    setMsg(null)
    try {
      if (team.studentIds.includes(studentId)) {
        await db.setTeamMembers(
          team.id,
          team.studentIds.filter((id) => id !== studentId),
        )
        return
      }
      for (const ot of data.teams) {
        if (ot.id === team.id) continue
        if (ot.studentIds.includes(studentId)) {
          await db.setTeamMembers(
            ot.id,
            ot.studentIds.filter((id) => id !== studentId),
          )
        }
      }
      await db.setTeamMembers(team.id, [...team.studentIds, studentId])
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao atualizar equipe.' })
    }
  }

  const criar = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      await db.addTeam(newName)
      setNewName('')
      setMsg({ type: 'ok', text: 'Equipe criada.' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro.' })
    }
  }

  const excluirEquipe = async (t: Team) => {
    if (!confirm(`Excluir equipe «${t.name}»?`)) return
    setMsg(null)
    try {
      await db.deleteTeam(t.id)
      setMsg({ type: 'ok', text: 'Equipe removida.' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro.' })
    }
  }

  return (
    <section className="screen-wrap equipes-layout">
      <Voltar onClick={onBack} />
      <h2 className="section-title">Equipes</h2>
      <p className="hint equipes-lead">
        Escolha um time à esquerda. Cada aluno só pode estar em uma equipe; ao incluir num time, ele sai dos
        outros. À direita, toque no card para entrar ou sair.
      </p>

      <form onSubmit={criar} className="team-create-bar">
        <input
          className="team-create-input"
          placeholder="Nome da nova equipe"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-primary team-create-btn">
          + Criar
        </button>
      </form>
      {msg && <div className={`msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}

      <div className="equipes-split">
        <aside className="equipes-rail" aria-label="Lista de equipes">
          {data.teams.length === 0 ? (
            <p className="hint">Nenhuma equipe ainda.</p>
          ) : (
            <ul className="team-rail-list">
              {data.teams.map((t, i) => {
                const accent = TEAM_ACCENTS[i % TEAM_ACCENTS.length]
                const active = t.id === activeTeamId
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`team-rail-card ${active ? 'active' : ''}`}
                      style={{ '--team-accent': accent } as CSSProperties}
                      onClick={() => {
                        void resumeAudio()
                        playMenuMove()
                        setPickedId(t.id)
                      }}
                    >
                      <span className="team-rail-name">{t.name}</span>
                      <span className="team-rail-count">{t.studentIds.length} alunos</span>
                      <div className="team-rail-avatars">
                        {t.studentIds.slice(0, 5).map((sid) => (
                          <img
                            key={sid}
                            src={spriteByStudent.get(sid) ?? ''}
                            alt=""
                            className="team-rail-mini"
                            width={28}
                            height={28}
                          />
                        ))}
                        {t.studentIds.length > 5 && (
                          <span className="team-rail-more">+{t.studentIds.length - 5}</span>
                        )}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="team-rail-trash"
                      title="Excluir equipe"
                      onClick={() => void excluirEquipe(t)}
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>

        <div className="equipes-main">
          {!team ? (
            <p className="hint">Crie uma equipe para montar o elenco.</p>
          ) : (
            <>
              <div
                className="equipes-main-head"
                style={{
                  borderColor:
                    TEAM_ACCENTS[Math.max(0, data.teams.findIndex((x) => x.id === team.id)) % TEAM_ACCENTS.length],
                }}
              >
                <h3 className="equipes-editing">{team.name}</h3>
                <p className="hint equipes-tap-hint">Toque no card do aluno para alternar na equipe.</p>
              </div>
              <div className="student-pick-grid">
                {data.students.map((s) => {
                  const inTeam = team.studentIds.includes(s.id)
                  const pk = getPokemon(s.pokemonKey)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`student-pick-tile ${inTeam ? 'in' : ''}`}
                      onClick={() => {
                        void resumeAudio()
                        playClick()
                        void toggleStudent(s.id)
                      }}
                    >
                      <img src={spriteByStudent.get(s.id) ?? ''} alt="" width={48} height={48} />
                      <span className="student-pick-name">{s.name}</span>
                      <span className="student-pick-mat">{s.matricula}</span>
                      <span className="student-pick-poke">{pk?.namePt}</span>
                      {inTeam && <span className="student-pick-badge">Na equipe</span>}
                    </button>
                  )
                })}
              </div>
              {data.students.length === 0 && <p className="hint">Cadastre alunos em Registros.</p>}
            </>
          )}
        </div>
      </div>
    </section>
  )
}

type RegSub = 'aluno' | 'tarefa' | 'atribuir'

export function RegistrarHub({ onBack }: { onBack: () => void }) {
  const [sub, setSub] = useState<RegSub>('aluno')
  return (
    <section className="screen-wrap">
      <Voltar onClick={onBack} />
      <h2 className="section-title">Registros</h2>
      <div className="subnav">
        <button
          type="button"
          className={sub === 'aluno' ? 'active' : ''}
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setSub('aluno')
          }}
        >
          Aluno
        </button>
        <button
          type="button"
          className={sub === 'tarefa' ? 'active' : ''}
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setSub('tarefa')
          }}
        >
          Tarefa
        </button>
        <button
          type="button"
          className={sub === 'atribuir' ? 'active' : ''}
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setSub('atribuir')
          }}
        >
          Atribuir pontos
        </button>
      </div>
      {sub === 'aluno' && <CadastroAluno />}
      {sub === 'tarefa' && <CadastroTarefa />}
      {sub === 'atribuir' && <AtribuirPontos />}
    </section>
  )
}

function CadastroAluno() {
  const { data, db } = useAppData()
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editId, setEditId] = useState<string | undefined>(undefined)
  const [name, setName] = useState('')
  const [matricula, setMatricula] = useState('')
  const [pokemonKey, setPokemonKey] = useState(POKEMON_LIST[0]?.key ?? '')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (view !== 'form') return
    if (editId) {
      const s = data.students.find((x) => x.id === editId)
      if (s) {
        setName(s.name)
        setMatricula(s.matricula)
        setPokemonKey(s.pokemonKey)
      }
    } else {
      setName('')
      setMatricula('')
      setPokemonKey(POKEMON_LIST[0]?.key ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: não puxar `data` pra não resetar no sync
  }, [view, editId])

  const openNew = () => {
    setEditId(undefined)
    setView('form')
    setMsg(null)
  }

  const openEdit = (id: string) => {
    setEditId(id)
    setView('form')
    setMsg(null)
  }

  const sortedStudents = useMemo(
    () => [...data.students].sort((a, b) => a.name.localeCompare(b.name, 'pt')),
    [data.students],
  )

  const standingsByStudent = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of buildStandings(data.students, data.scores)) {
      m.set(r.student.id, r.spriteUrl)
    }
    return m
  }, [data.students, data.scores])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    if (!isValidMatricula7(matricula)) {
      setMsg({ type: 'err', text: matriculaErrorMessage() })
      return
    }
    try {
      if (editId) {
        await db.updateStudent(editId, { name, matricula, pokemonKey })
        setMsg({ type: 'ok', text: 'Aluno atualizado.' })
        playConfirm()
      } else {
        await db.addStudent(name, matricula, pokemonKey)
        setMsg({ type: 'ok', text: 'Aluno cadastrado.' })
        playConfirm()
        setView('list')
      }
    } catch (err) {
      playError()
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao salvar.' })
    }
  }

  if (view === 'list') {
    return (
      <div>
        <div className="crud-toolbar">
          <h3 className="sub-title">Alunos</h3>
          <button
            type="button"
            className="btn-primary btn-small"
            onClick={() => {
              void resumeAudio()
              playClick()
              openNew()
            }}
          >
            + Novo aluno
          </button>
        </div>
        {sortedStudents.length === 0 ? (
          <p className="hint">Nenhum aluno. Clique em «Novo aluno».</p>
        ) : (
          <ul className="pick-list pick-list--cards">
            {sortedStudents.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="pick-list-row pick-list-row--student"
                  onClick={() => {
                    void resumeAudio()
                    playMenuMove()
                    openEdit(s.id)
                  }}
                >
                  <img
                    src={standingsByStudent.get(s.id) ?? ''}
                    alt=""
                    className="pick-card-sprite"
                    width={56}
                    height={56}
                  />
                  <span className="pick-list-main">
                    <strong>{s.name}</strong>
                    <span className="pick-list-sub">
                      {s.matricula} · {getPokemon(s.pokemonKey)?.namePt}
                    </span>
                  </span>
                  <span className="pick-list-chev">▶</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="crud-toolbar">
        <button
          type="button"
          className="btn-back btn-inline"
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setView('list')
          }}
        >
          ◀ Lista
        </button>
        <h3 className="sub-title">{editId ? 'Editar aluno' : 'Novo aluno'}</h3>
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="nm">Nome</label>
          <input
            id="nm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="mat">Matrícula (7 números)</label>
          <input
            id="mat"
            value={matricula}
            onChange={(e) => setMatricula(clampMatriculaInput(e.target.value))}
            inputMode="numeric"
            autoComplete="off"
            maxLength={7}
            placeholder="0000000"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="pk">Pokémon (só um)</label>
          <select id="pk" value={pokemonKey} onChange={(e) => setPokemonKey(e.target.value)}>
            {POKEMON_LIST.map((p) => (
              <option key={p.key} value={p.key}>
                {p.namePt}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          {editId ? 'Salvar alterações' : 'Cadastrar'}
        </button>
        {msg && <div className={`msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}
      </form>
      <p className="hint">Tipos só no placar Pokédex. Evolução a cada 100 pts.</p>
    </div>
  )
}

function CadastroTarefa() {
  const { data, db } = useAppData()
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editId, setEditId] = useState<string | undefined>(undefined)
  const [title, setTitle] = useState('')
  const [maxPoints, setMaxPoints] = useState('10')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (view !== 'form') return
    if (editId) {
      const t = data.tasks.find((x) => x.id === editId)
      if (t) {
        setTitle(t.title)
        setMaxPoints(String(t.maxPoints))
      }
    } else {
      setTitle('')
      setMaxPoints('10')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intencional: mesmo motivo que no cadastro de aluno
  }, [view, editId])

  const openNew = () => {
    setEditId(undefined)
    setView('form')
    setMsg(null)
  }

  const openEdit = (id: string) => {
    setEditId(id)
    setView('form')
    setMsg(null)
  }

  const sortedTasks = useMemo(
    () => [...data.tasks].sort((a, b) => a.title.localeCompare(b.title, 'pt')),
    [data.tasks],
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const mp = Number(maxPoints)
    try {
      if (editId) {
        await db.updateTask(editId, { title, maxPoints: mp })
        setMsg({ type: 'ok', text: 'Tarefa atualizada.' })
        playConfirm()
      } else {
        await db.addTask(title, mp)
        setMsg({ type: 'ok', text: 'Tarefa cadastrada.' })
        playConfirm()
        setView('list')
      }
    } catch (err) {
      playError()
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao salvar.' })
    }
  }

  if (view === 'list') {
    return (
      <div>
        <div className="crud-toolbar">
          <h3 className="sub-title">Tarefas</h3>
          <button
            type="button"
            className="btn-primary btn-small"
            onClick={() => {
              void resumeAudio()
              playClick()
              openNew()
            }}
          >
            + Nova tarefa
          </button>
        </div>
        {sortedTasks.length === 0 ? (
          <p className="hint">Nenhuma tarefa. Clique em «Nova tarefa».</p>
        ) : (
          <ul className="pick-list pick-list--cards pick-list--tasks">
            {sortedTasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="pick-list-row pick-list-row--task"
                  onClick={() => {
                    void resumeAudio()
                    playMenuMove()
                    openEdit(t.id)
                  }}
                >
                  <span className="pick-task-icon" aria-hidden>
                    ✎
                  </span>
                  <span className="pick-list-main">
                    <strong>{t.title}</strong>
                    <span className="pick-list-sub">Valor máximo da tarefa</span>
                  </span>
                  <span className="pick-task-pts">{t.maxPoints} pts</span>
                  <span className="pick-list-chev">▶</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="crud-toolbar">
        <button
          type="button"
          className="btn-back btn-inline"
          onClick={() => {
            void resumeAudio()
            playMenuMove()
            setView('list')
          }}
        >
          ◀ Lista
        </button>
        <h3 className="sub-title">{editId ? 'Editar tarefa' : 'Nova tarefa'}</h3>
      </div>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="tt">Título</label>
          <input id="tt" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="mx">Valor máximo (pontos)</label>
          <input
            id="mx"
            type="number"
            min={0}
            step={1}
            value={maxPoints}
            onChange={(e) => setMaxPoints(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          {editId ? 'Salvar alterações' : 'Cadastrar'}
        </button>
        {msg && <div className={`msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}
      </form>
      <p className="hint">Se já houver notas acima do novo máximo, o sistema bloqueia a edição.</p>
    </div>
  )
}

function AtribuirPontos() {
  const { data, db } = useAppData()
  const [studentId, setStudentId] = useState('')
  const [taskId, setTaskId] = useState('')
  const [points, setPoints] = useState('0')
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const tasks = data.tasks
  const students = data.students

  const task = tasks.find((t) => t.id === taskId)

  const currentScore = useMemo(() => {
    if (!taskId || !studentId) return undefined
    return scoreForTask(data.scores, studentId, taskId)
  }, [data.scores, studentId, taskId])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    const p = Number(points)
    try {
      await db.setTaskScore(studentId, taskId, p)
      playConfirm()
      setMsg({ type: 'ok', text: 'Pontos salvos.' })
    } catch (err) {
      playError()
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro ao salvar.' })
    }
  }

  if (tasks.length === 0 || students.length === 0) {
    return (
      <div>
        <h3 className="sub-title">Atribuir pontos</h3>
        <p className="hint">Cadastre aluno e tarefa antes.</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="sub-title">Atribuir pontos</h3>
      <p className="hint atribuir-hint-static">
        Um único lançamento por aluno e tarefa — «Aplicar» grava ou <strong>substitui</strong> a nota.
      </p>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="stu">Aluno</label>
          <select
            id="stu"
            value={studentId}
            onChange={(e) => {
              setStudentId(e.target.value)
              setMsg(null)
            }}
            required
          >
            <option value="">—</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.matricula})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tsk">Tarefa</label>
          <select
            id="tsk"
            value={taskId}
            onChange={(e) => {
              setTaskId(e.target.value)
              const t = tasks.find((x) => x.id === e.target.value)
              if (t) setPoints(String(t.maxPoints))
              setMsg(null)
            }}
            required
          >
            <option value="">—</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} (máx. {t.maxPoints})
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pts">Pontos obtidos</label>
          <input
            id="pts"
            type="number"
            min={0}
            max={task?.maxPoints ?? undefined}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
          />
        </div>
        {task && <p className="hint">Máximo desta tarefa: {task.maxPoints} pts</p>}
        {studentId && taskId && currentScore !== undefined && (
          <p className="hint atribuir-hint-score">
            Nota atual nesta combinação: <strong>{currentScore} pts</strong> (será substituída ao aplicar).
          </p>
        )}
        <button type="submit" className="btn-primary">
          Aplicar
        </button>
        {msg && <div className={`msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}
      </form>
    </div>
  )
}

export function ListaScreen({ onBack }: { onBack: () => void }) {
  const { data, db } = useAppData()
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const spriteByStudent = useMemo(() => {
    const standings = buildStandings(data.students, data.scores)
    return new Map(standings.map((r) => [r.student.id, r.spriteUrl]))
  }, [data.students, data.scores])

  const delAluno = async (s: Student) => {
    if (!confirm(`Excluir aluno ${s.name}?`)) return
    setMsg(null)
    try {
      await db.deleteStudent(s.id)
      setMsg({ type: 'ok', text: 'Aluno removido.' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro.' })
    }
  }

  const delTarefa = async (t: Task) => {
    if (!confirm(`Excluir tarefa "${t.title}"?`)) return
    setMsg(null)
    try {
      await db.deleteTask(t.id)
      setMsg({ type: 'ok', text: 'Tarefa removida.' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro.' })
    }
  }

  const delEquipe = async (t: Team) => {
    if (!confirm(`Excluir equipe "${t.name}"?`)) return
    setMsg(null)
    try {
      await db.deleteTeam(t.id)
      setMsg({ type: 'ok', text: 'Equipe removida.' })
    } catch (err) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Erro.' })
    }
  }

  return (
    <section className="screen-wrap">
      <Voltar onClick={onBack} />
      <h2 className="section-title">Lista geral</h2>
      {msg && <div className={`msg ${msg.type === 'ok' ? 'ok' : 'err'}`}>{msg.text}</div>}
      <h3 className="sub-title">Alunos</h3>
      <ul className="crud-list">
        {data.students.map((s) => (
          <li key={s.id}>
            <span>
              {s.name} · {s.matricula} · {getPokemon(s.pokemonKey)?.namePt}
            </span>
            <button type="button" className="btn-danger-soft" onClick={() => void delAluno(s)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
      {data.students.length === 0 && <p className="hint">Nenhum aluno.</p>}
      <h3 className="sub-title">Tarefas</h3>
      <ul className="crud-list">
        {data.tasks.map((t) => (
          <li key={t.id}>
            <span>
              {t.title} (máx. {t.maxPoints})
            </span>
            <button type="button" className="btn-danger-soft" onClick={() => void delTarefa(t)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
      {data.tasks.length === 0 && <p className="hint">Nenhuma tarefa.</p>}
      <h3 className="sub-title">Equipes</h3>
      <ul className="crud-list crud-list-equipes">
        {data.teams.map((t) => (
          <li key={t.id} className="crud-list-equipe">
            <div className="lista-equipe-body">
              <span className="lista-equipe-name">{t.name}</span>
              <div className="lista-equipe-sprites" aria-label="Pokémon dos membros">
                {t.studentIds.length === 0 ? (
                  <span className="hint lista-equipe-empty">Sem membros</span>
                ) : (
                  t.studentIds.map((sid) => (
                    <img
                      key={sid}
                      src={spriteByStudent.get(sid) ?? ''}
                      alt=""
                      className="lista-equipe-mini"
                      width={32}
                      height={32}
                    />
                  ))
                )}
              </div>
            </div>
            <button type="button" className="btn-danger-soft" onClick={() => void delEquipe(t)}>
              Excluir
            </button>
          </li>
        ))}
      </ul>
      {data.teams.length === 0 && <p className="hint">Nenhuma equipe.</p>}
      <h3 className="sub-title">Prévia Pokémon</h3>
      <div className="cards mini-cards">
        {data.students.map((s) => {
          const total = totalPointsForStudent(data.scores, s.id)
          const st = buildStandings([s], data.scores)[0]
          const pk = getPokemon(s.pokemonKey)
          return (
            <div key={s.id} className="card">
              <img src={st?.spriteUrl} alt="" width={48} height={48} loading="lazy" />
              <div className="mini-name" title={s.name}>
                {s.name}
              </div>
              <div className="pts">{total} pts</div>
              <div className="hint">{pk?.namePt}</div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
