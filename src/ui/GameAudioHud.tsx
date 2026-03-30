import { useEffect, useState } from 'react'
import {
  isBgmMuted,
  isMasterMuted,
  resumeAudio,
  toggleBgmEnabled,
  toggleMasterMuted,
} from '../audio/gameAudio'

export function GameAudioHud() {
  const [master, setMaster] = useState(isMasterMuted)
  const [bgm, setBgm] = useState(isBgmMuted)

  useEffect(() => {
    const unlock = () => {
      void resumeAudio()
    }
    window.addEventListener('pointerdown', unlock, { once: true, capture: true })
    return () => window.removeEventListener('pointerdown', unlock, { capture: true })
  }, [])

  const onMaster = () => {
    void resumeAudio()
    toggleMasterMuted()
    setMaster(isMasterMuted())
    setBgm(isBgmMuted())
  }

  const onBgm = () => {
    void resumeAudio()
    toggleBgmEnabled()
    setBgm(isBgmMuted())
  }

  return (
    <div className="audio-hud" role="toolbar" aria-label="Controlo de áudio">
      <button
        type="button"
        className={`audio-hud-btn ${master ? 'off' : ''}`}
        title={master ? 'Ativar sons' : 'Silenciar tudo'}
        onClick={onMaster}
      >
        {master ? '🔇' : '🔊'}
      </button>
      <button
        type="button"
        className={`audio-hud-btn ${bgm ? 'off' : ''}`}
        title={bgm ? 'Ligar trilha (GBA / ficheiro bgm.mp3)' : 'Desligar trilha'}
        onClick={onBgm}
      >
        {bgm ? '♫' : '♪'}
      </button>
    </div>
  )
}
