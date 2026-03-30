import { useState } from 'react'
import { playClick, resumeAudio } from './audio/gameAudio'
import { DataProvider } from './context/DataContext'
import { useAppData } from './context/useAppData'
import { useEvolutionQueue } from './hooks/useEvolutionQueue'
import { EvolutionOverlay } from './ui/EvolutionOverlay'
import { GameAudioHud } from './ui/GameAudioHud'
import {
  EquipesScreen,
  GbaHome,
  ListaScreen,
  PlanilhaScreen,
  PlacarScreen,
  RegistrarHub,
  type RootScreen,
} from './views/screens'

function AppShell() {
  const { data } = useAppData()
  const { current, dismiss } = useEvolutionQueue(data.students, data.scores)
  const [screen, setScreen] = useState<RootScreen>('home')

  const nav = (next: RootScreen) => {
    void resumeAudio()
    playClick()
    setScreen(next)
  }

  const inner = (
    <>
      {screen === 'placar' && <PlacarScreen onBack={() => nav('home')} />}
      {screen === 'equipes' && <EquipesScreen onBack={() => nav('home')} />}
      {screen === 'registrar' && <RegistrarHub onBack={() => nav('home')} />}
      {screen === 'lista' && <ListaScreen onBack={() => nav('home')} />}
      {screen === 'planilha' && <PlanilhaScreen onBack={() => nav('home')} />}
    </>
  )

  return (
    <>
      <GameAudioHud />
      {current && (
        <EvolutionOverlay key={current.id} event={current} onDone={dismiss} />
      )}
      {screen === 'home' ? (
        <GbaHome
          onPlacar={() => nav('placar')}
          onRegistrar={() => nav('registrar')}
          onEquipes={() => nav('equipes')}
          onLista={() => nav('lista')}
          onPlanilha={() => nav('planilha')}
        />
      ) : (
        <div className={screen === 'planilha' ? 'gba-console gba-console--planilha' : 'gba-console'}>
          <div className="gba-top">PLACAR POKéMON</div>
          <div className="gba-screen">{inner}</div>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  )
}
