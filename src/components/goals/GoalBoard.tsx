import type { Goal, GoalJournalEntry } from '../../hooks/useGoals'
import { GoalCard } from './GoalCard'

const statusOrder: Goal['status'][] = ['not started', 'in progress', 'on hold', 'completed']
function nextStatus(status: Goal['status']): Goal['status'] { return statusOrder[(statusOrder.indexOf(status) + 1) % statusOrder.length] }

export function GoalBoard({ goals, entries, onCycleStatus, onAddJournal }: { goals: Goal[]; entries: GoalJournalEntry[]; onCycleStatus: (goal: Goal) => Promise<void>; onAddJournal: (goalId: string, text: string) => Promise<void> }) {
  return (
    <div className="flex items-start gap-4 overflow-x-auto pb-2">
      {goals.map((goal) => <GoalCard key={goal.id} goal={goal} entries={entries} onCycleStatus={() => onCycleStatus({ ...goal, status: nextStatus(goal.status) })} onAddJournal={(text) => onAddJournal(goal.id, text)} />)}
      <button type="button" className="flex h-[220px] w-[240px] min-w-[240px] items-center justify-center rounded-xl border-[0.5px] border-dashed border-[var(--border)] bg-white text-[12px] font-medium text-[var(--goals)]">+ New Goal</button>
    </div>
  )
}
