import { useState } from 'react'
import type { Goal, GoalJournalEntry } from '../../hooks/useGoals'
import { JournalTab } from './JournalTab'
import { StepsTab } from './StepsTab'

const statuses: Goal['status'][] = ['not started', 'in progress', 'on hold', 'completed']

function dateLabel(date: string | null) {
  if (!date) return 'No target date'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function GoalCard({ goal, entries, onCycleStatus, onAddJournal }: { goal: Goal; entries: GoalJournalEntry[]; onCycleStatus: () => Promise<void>; onAddJournal: (text: string) => Promise<void> }) {
  const [tab, setTab] = useState<'journal' | 'steps'>('journal')
  const goalEntries = entries.filter((entry) => entry.goal_id === goal.id)

  return (
    <article className="flex max-h-full w-[320px] min-w-[320px] flex-col overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-white">
      <div className="h-1 w-full" style={{ backgroundColor: goal.color ?? '#93738e' }} />
      <div className="border-b-[0.5px] border-[var(--border)] px-4 py-3">
        <div className="mb-2 flex items-start gap-2">
          <h3 className="min-w-0 flex-1 font-serif text-[15px] font-medium leading-snug tracking-[-0.2px]">{goal.title}</h3>
          <button type="button" className="rounded-md px-1.5 py-1 text-[16px] leading-none text-[var(--muted)] hover:bg-[#f5f3f0]">⋯</button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className="rounded-full bg-[rgba(147,115,142,0.15)] px-2.5 py-1 text-[10.5px] font-medium text-[var(--goals)]" onClick={() => void onCycleStatus()} title={`Cycle status (${statuses.join(', ')})`}>{goal.status}</button>
          <span className="rounded bg-[#f5f3f0] px-2 py-1 text-[10.5px] text-[var(--muted)]">{goal.category || 'Uncategorized'}</span>
          <span className="rounded bg-[#f5f3f0] px-2 py-1 text-[10.5px] text-[var(--muted)]">{dateLabel(goal.target_date)}</span>
        </div>
      </div>
      <div className="flex border-b-[0.5px] border-[var(--border)] bg-[#faf9f8] p-1.5">
        <button type="button" className={`flex-1 rounded-md px-3 py-1.5 text-[11.5px] ${tab === 'journal' ? 'bg-white text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'text-[var(--muted)]'}`} onClick={() => setTab('journal')}>Journal</button>
        <button type="button" className={`flex-1 rounded-md px-3 py-1.5 text-[11.5px] ${tab === 'steps' ? 'bg-white text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.08)]' : 'text-[var(--muted)]'}`} onClick={() => setTab('steps')}>Steps</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'journal' ? <JournalTab goalId={goal.id} entries={goalEntries} onAdd={onAddJournal} /> : <StepsTab goalId={goal.id} />}
      </div>
    </article>
  )
}
