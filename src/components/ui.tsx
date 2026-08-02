import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { BlockColor } from '../types'
import { clsx } from '../lib/util'

export const blockStyles: Record<BlockColor, { bar: string; chip: string; text: string; ring: string }> = {
  red: { bar: 'bg-red-600', chip: 'bg-red-500/15 text-red-300', text: 'text-red-300', ring: 'border-red-500/30' },
  blue: { bar: 'bg-blue-600', chip: 'bg-blue-500/15 text-blue-300', text: 'text-blue-300', ring: 'border-blue-500/30' },
  purple: {
    bar: 'bg-purple-600',
    chip: 'bg-purple-500/15 text-purple-300',
    text: 'text-purple-300',
    ring: 'border-purple-500/30',
  },
  green: {
    bar: 'bg-emerald-600',
    chip: 'bg-emerald-500/15 text-emerald-300',
    text: 'text-emerald-300',
    ring: 'border-emerald-500/30',
  },
  amber: {
    bar: 'bg-amber-600',
    chip: 'bg-amber-500/15 text-amber-300',
    text: 'text-amber-300',
    ring: 'border-amber-500/30',
  },
  gray: { bar: 'bg-slate-600', chip: 'bg-slate-500/15 text-slate-300', text: 'text-slate-300', ring: 'border-slate-500/30' },
  slate: {
    bar: 'bg-slate-700',
    chip: 'bg-slate-600/20 text-slate-400',
    text: 'text-slate-400',
    ring: 'border-slate-600/30',
  },
}

export const colorOptions: { value: BlockColor; label: string }[] = [
  { value: 'red', label: 'Rot' },
  { value: 'blue', label: 'Blau' },
  { value: 'purple', label: 'Violett' },
  { value: 'green', label: 'Grün' },
  { value: 'amber', label: 'Gelb' },
  { value: 'gray', label: 'Grau' },
  { value: 'slate', label: 'Dunkelgrau' },
]

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-orange-500 text-slate-950 font-semibold hover:bg-orange-400 active:bg-orange-600',
  secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700',
  ghost: 'text-slate-300 hover:bg-slate-800',
  danger: 'bg-red-950 text-red-300 border border-red-900 hover:bg-red-900/60',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:pointer-events-none',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2.5 text-sm',
        variants[variant],
        className,
      )}
      {...rest}
    />
  )
}

export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        className ?? 'bg-slate-800 text-slate-300',
      )}
    >
      {children}
    </span>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold tracking-widest text-slate-500 uppercase">{children}</h2>
      {action}
    </div>
  )
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card px-4 py-10 text-center">
      <p className="text-sm text-slate-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</span>
      {children}
    </label>
  )
}

/** A bottom sheet — big enough for a recipe, dismissible by backdrop or the X. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-800 bg-slate-900 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            className="-mt-1 -mr-1 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-slate-800 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? 'h-5 w-5'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export type IconName =
  | 'plan'
  | 'play'
  | 'history'
  | 'recipe'
  | 'more'
  | 'plus'
  | 'trash'
  | 'up'
  | 'down'
  | 'pencil'
  | 'check'
  | 'link'
  | 'search'
  | 'star'
  | 'upload'
  | 'timer'

const paths: Record<IconName, ReactNode> = {
  plan: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2.5" />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5.5 3.5L10 15.5z" fill="currentColor" stroke="none" />
    </>
  ),
  history: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3.5 4.5V10H9" />
      <path d="M12 8v4.5l3 1.8" />
    </>
  ),
  recipe: (
    <>
      <path d="M6 3v8a3 3 0 0 0 6 0V3" />
      <path d="M9 11v10" />
      <path d="M17 3c1.7 1.4 2.5 3.3 2.5 5.5S18.7 12.6 17 14v7" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  trash: (
    <>
      <path d="M4 7h16M9 7V4.5h6V7M6.5 7l.8 12.5h9.4L17.5 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </>
  ),
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M18 13l-6 6-6-6" />,
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
      <path d="M14.5 5.5L18.5 9.5" />
    </>
  ),
  check: <path d="M5 13l4.5 4.5L19 7" />,
  link: (
    <>
      <path d="M10 13a4 4 0 0 0 5.7 0l2.8-2.8a4 4 0 1 0-5.7-5.7L11.5 6" />
      <path d="M14 11a4 4 0 0 0-5.7 0L5.5 13.8a4 4 0 1 0 5.7 5.7L12.5 18" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4 4" />
    </>
  ),
  star: <path d="M12 4l2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8z" />,
  upload: (
    <>
      <path d="M12 16V4M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9.5V13l2.5 1.5M9.5 3h5" />
    </>
  ),
}
