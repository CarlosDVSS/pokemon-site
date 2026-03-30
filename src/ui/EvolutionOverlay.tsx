import { useEffect, useState } from 'react'
import { playEvolutionComplete, playEvolutionPhase, resumeAudio } from '../audio/gameAudio'
import type { EvoEvent } from '../hooks/useEvolutionQueue'

type Props = {
  event: EvoEvent
  onDone: () => void
}

export function EvolutionOverlay({ event, onDone }: Props) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const ids = [
      window.setTimeout(() => setPhase(1), 900),
      window.setTimeout(() => setPhase(2), 2100),
      window.setTimeout(() => setPhase(3), 2800),
      window.setTimeout(() => setPhase(4), 4000),
      window.setTimeout(() => onDone(), 6000),
    ]
    return () => ids.forEach(clearTimeout)
  }, [event, onDone])

  useEffect(() => {
    void resumeAudio()
    if (phase === 4) playEvolutionComplete()
    else playEvolutionPhase(phase)
  }, [phase])

  return (
    <div className="evo-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div className="evo-backdrop" />
      <div className="evo-panel">
        <div className="evo-textbox">
          {(phase === 0 || phase === 1) && (
            <p className="evo-line">O quê? {event.fromNamePt} está evoluindo!</p>
          )}
          {phase === 2 && <p className="evo-line flash-line">……!!</p>}
          {phase >= 4 && (
            <p className="evo-line evo-done-line">
              Parabéns! {event.fromNamePt} evoluiu para {event.toNamePt}!
            </p>
          )}
        </div>
        <div className={`evo-sprite-stage ${phase === 1 ? 'shake' : ''}`}>
          {phase === 2 && <div className="evo-flash-full" aria-hidden />}
          {phase < 3 && phase !== 2 && (
            <img src={event.fromUrl} alt="" className="evo-sprite" width={120} height={120} />
          )}
          {phase >= 3 && (
            <img src={event.toUrl} alt="" className="evo-sprite evo-pop" width={120} height={120} />
          )}
        </div>
      </div>
    </div>
  )
}
