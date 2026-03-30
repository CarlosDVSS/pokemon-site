// Bips no Web Audio; BGM tenta public/bgm.mp3 ou loop sintético.

const LS_MASTER = 'placar-pokemon-audio-master'
const LS_BGM = 'placar-pokemon-audio-bgm'

let ctx: AudioContext | null = null
function readLs(key: string): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(key)
}

let masterMuted = readLs(LS_MASTER) === '1'
// BGM: só toca de fato se LS_BGM === '0' (primeira visita fica mudo até ligar).
let bgmMuted = readLs(LS_BGM) !== '0'

let bgmEl: HTMLAudioElement | null = null
let proceduralId: number | null = null

function ensureCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export async function resumeAudio(): Promise<void> {
  const c = ensureCtx()
  if (c.state === 'suspended') await c.resume()
}

export function isMasterMuted(): boolean {
  return masterMuted
}

export function isBgmMuted(): boolean {
  return bgmMuted
}

export function setMasterMuted(m: boolean): void {
  masterMuted = m
  try {
    localStorage.setItem(LS_MASTER, m ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (m) stopBgmInternal()
  else if (!bgmMuted) void startBgmInternal()
}

export function setBgmMuted(m: boolean): void {
  bgmMuted = m
  try {
    localStorage.setItem(LS_BGM, m ? '1' : '0')
  } catch {
    /* ignore */
  }
  if (m) stopBgmInternal()
  else if (!masterMuted) void startBgmInternal()
}

function playTone(
  freq: number,
  dur: number,
  vol = 0.1,
  type: OscillatorType = 'square',
  when?: number,
): void {
  if (masterMuted) return
  const ac = ensureCtx()
  const t = when ?? ac.currentTime
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(dur, 0.02))
  osc.connect(g).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.03)
}

export function playClick(): void {
  playTone(1046.5, 0.035, 0.09, 'square')
}

export function playMenuMove(): void {
  playTone(660, 0.04, 0.07, 'square')
}

export function playConfirm(): void {
  const ac = ensureCtx()
  if (masterMuted) return
  const t = ac.currentTime
  playTone(523.25, 0.07, 0.1, 'square', t)
  playTone(659.25, 0.08, 0.1, 'square', t + 0.08)
  playTone(783.99, 0.12, 0.11, 'square', t + 0.16)
}

export function playError(): void {
  const ac = ensureCtx()
  if (masterMuted) return
  const t = ac.currentTime
  playTone(200, 0.12, 0.12, 'sawtooth', t)
  playTone(165, 0.15, 0.1, 'sawtooth', t + 0.1)
}

export function playEvolutionPhase(phase: number): void {
  if (masterMuted) return
  const base = 220 + phase * 180
  playTone(base, 0.08 + phase * 0.02, 0.11, phase === 2 ? 'sawtooth' : 'square')
}

export function playEvolutionComplete(): void {
  if (masterMuted) return
  const ac = ensureCtx()
  const t = ac.currentTime
  ;[784, 988, 1175, 1319].forEach((f, i) => playTone(f, 0.1, 0.09, 'square', t + i * 0.09))
}

function stopBgmInternal(): void {
  if (bgmEl) {
    bgmEl.pause()
    bgmEl.src = ''
    bgmEl = null
  }
  if (proceduralId !== null) {
    clearInterval(proceduralId)
    proceduralId = null
  }
}

function startProceduralBgm(): void {
  stopBgmInternal()
  if (masterMuted || bgmMuted) return
  const seq = [
    523.25, 587.33, 659.25, 698.46, 783.99, 698.46, 659.25, 587.33,
    493.88, 554.37, 622.25, 659.25, 739.99, 659.25, 622.25, 554.37,
  ]
  let i = 0
  proceduralId = window.setInterval(() => {
    if (masterMuted || bgmMuted) return
    void resumeAudio()
    playTone(seq[i % seq.length], 0.14, 0.055, 'triangle')
    i++
  }, 165)
}

async function startBgmInternal(): Promise<void> {
  if (masterMuted || bgmMuted) return
  await resumeAudio()
  stopBgmInternal()
  const el = new Audio('/bgm.mp3')
  el.loop = true
  el.volume = 0.22
  const ok = await new Promise<boolean>((resolve) => {
    let settled = false
    const done = (v: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(tid)
      el.removeEventListener('canplaythrough', onOk)
      el.removeEventListener('error', onErr)
      resolve(v)
    }
    const tid = window.setTimeout(() => done(false), 2000)
    const onOk = () => done(true)
    const onErr = () => done(false)
    el.addEventListener('canplaythrough', onOk, { once: true })
    el.addEventListener('error', onErr, { once: true })
    el.load()
  })
  if (ok) {
    try {
      await el.play()
      bgmEl = el
      return
    } catch {
      /* fallthrough */
    }
  }
  startProceduralBgm()
}

export async function startBgm(): Promise<void> {
  await startBgmInternal()
}

export function toggleBgmEnabled(): void {
  setBgmMuted(!bgmMuted)
}

export function toggleMasterMuted(): void {
  setMasterMuted(!masterMuted)
}
