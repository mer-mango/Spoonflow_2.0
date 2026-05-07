import { useState } from 'react'
import type { Goal, GoalJournalEntry } from '../../hooks/useGoals'
import { JournalTab } from './JournalTab'
import { StepsTab } from './StepsTab'

const statuses: Goal['status'][] = ['not started', 'in progress', 'on hold', 'completed']

export function GoalCard({
  goal,
  entries,
  onCycleStatus,
  onAddJournal,
}: {
  goal: Goal
  entries: GoalJournalEntry[]
  onCycleStatus: () => Promise<void>
  onAddJournal: (text: string) => Promise<void>
}) {
  const [tab, setTab] = useState<'journal' | 'steps'>('journal')

  return (
    <article className="w-[320px] shrink-0 rounded-2xl bg-white p-3">
      <div className="mb-2 h-2 rounded" style={{ backgroundColor: goal.color ?? '#93738e' }} />
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg">{goal.title}</h3>
          <p className="text-xs text-[var(--muted)]">{goal.category || 'Uncategorized'}</p>
        </div>
        <button
          type="button"
          className="rounded-full bg-[var(--goals)] px-2 py-1 text-xs text-white"
          onClick={() => void onCycleStatus()}
          title={`Cycle status (${statuses.join(', ')})`}
        >
          {goal.status}
        </button>
      </div>
      <div className="mb-2 flex gap-2 text-xs">
        <button
          type="button"
          className={`rounded px-2 py-1 ${tab === 'journal' ? 'bg-[var(--jamie)] text-white' : 'bg-black/5'}`}
          onClick={() => setTab('journal')}
        >
          Journal
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${tab === 'steps' ? 'bg-[var(--jamie)] text-white' : 'bg-black/5'}`}
          onClick={() => setTab('steps')}
        >
          Steps
        </button>
      </div>
      {tab === 'journal' ? (
        <JournalTab goalId={goal.id} entries={entries} onAdd={onAddJournal} />
      ) : (
        <StepsTab goalId={goal.id} />
      )}
    </article>
  )
}
