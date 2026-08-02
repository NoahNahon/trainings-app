import { useEffect, useRef, useState } from 'react'
import { Button, Icon } from './ui'
import { mmss } from '../lib/util'

/**
 * Countdown that survives re-renders and backgrounding: we store the target
 * timestamp, not a decrementing counter, so tab throttling can't drift it.
 */
export function useCountdown() {
  const [endsAt, setEndsAt] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (endsAt === null) return
    const tick = () => {
      const left = (endsAt - Date.now()) / 1000
      setRemaining(left)
      if (left <= 0) {
        setEndsAt(null)
        beep()
      }
    }
    tick()
    const handle = window.setInterval(tick, 200)
    return () => window.clearInterval(handle)
  }, [endsAt])

  return {
    active: endsAt !== null,
    remaining,
    label,
    start(seconds: number, text: string) {
      setLabel(text)
      setEndsAt(Date.now() + seconds * 1000)
    },
    add(seconds: number) {
      setEndsAt((prev) => (prev === null ? Date.now() + seconds * 1000 : prev + seconds * 1000))
    },
    stop() {
      setEndsAt(null)
    },
  }
}

let audioCtx: AudioContext | null = null

/** Short double beep — no asset needed, works offline. */
function beep() {
  try {
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    audioCtx ??= new Ctor()
    const ctx = audioCtx
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    for (const [i, freq] of [880, 1180].entries()) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = freq
      osc.type = 'sine'
      gain.gain.setValueAtTime(0, now + i * 0.18)
      gain.gain.linearRampToValueAtTime(0.22, now + i * 0.18 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.16)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + i * 0.18)
      osc.stop(now + i * 0.18 + 0.18)
    }
    navigator.vibrate?.([120, 60, 120])
  } catch {
    /* audio blocked — the visual countdown is enough */
  }
}

export function TimerBar({ timer }: { timer: ReturnType<typeof useCountdown> }) {
  const total = useRef(0)
  const wasActive = useRef(false)

  // Remember the initial duration so the progress bar has a denominator.
  if (timer.active && !wasActive.current) total.current = Math.max(timer.remaining, 1)
  if (timer.active && timer.remaining > total.current) total.current = timer.remaining
  wasActive.current = timer.active

  if (!timer.active) return null
  const pct = Math.max(0, Math.min(100, (timer.remaining / total.current) * 100))

  return (
    <div className="fixed inset-x-0 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-40 px-3">
      <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-orange-500/40 bg-slate-900/95 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-orange-500 transition-[width] duration-200 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Icon name="timer" className="h-5 w-5 shrink-0 text-orange-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-slate-400">{timer.label}</p>
            <p className="text-xl leading-tight font-bold tabular-nums text-slate-50">{mmss(timer.remaining)}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => timer.add(15)}>
            +15s
          </Button>
          <Button size="sm" variant="ghost" onClick={timer.stop}>
            Stop
          </Button>
        </div>
      </div>
    </div>
  )
}
