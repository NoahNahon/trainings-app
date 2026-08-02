import { useEffect, useState } from 'react'
import { StoreProvider } from './store'
import { PlanPage } from './pages/PlanPage'
import { WorkoutPage } from './pages/WorkoutPage'
import { HistoryPage } from './pages/HistoryPage'
import { RecipesPage } from './pages/RecipesPage'
import { MorePage } from './pages/MorePage'
import { Icon, type IconName } from './components/ui'
import { clsx } from './lib/util'

type Tab = 'plan' | 'workout' | 'history' | 'recipes' | 'more'

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'workout', label: 'Training', icon: 'play' },
  { id: 'history', label: 'Verlauf', icon: 'history' },
  { id: 'recipes', label: 'Rezepte', icon: 'recipe' },
  { id: 'more', label: 'Mehr', icon: 'more' },
]

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}

function Shell() {
  const [tab, setTab] = useState<Tab>('plan')

  // Switching tabs should feel like navigating, not like scrolling a long page.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab])

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <main className="px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {tab === 'plan' && <PlanPage onStartWorkout={() => setTab('workout')} />}
        {tab === 'workout' && <WorkoutPage onFinished={() => setTab('history')} />}
        {tab === 'history' && <HistoryPage />}
        {tab === 'recipes' && <RecipesPage />}
        {tab === 'more' && <MorePage />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg pb-[env(safe-area-inset-bottom)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={clsx(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                tab === t.id ? 'text-orange-400' : 'text-slate-500 hover:text-slate-300',
              )}
            >
              <Icon name={t.icon} className="h-5 w-5" />
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
