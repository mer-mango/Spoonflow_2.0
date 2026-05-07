import type { Goal, GoalJournalEntry } from '../../hooks/useGoals'
import { GoalCard } from './GoalCard'

const statusOrder: Goal['status'][] = ['not started', 'in progress', 'on hold', 'completed']

function nextStatus(status: Goal['status']): Goal['status'] {
  const idx = statusOrder.indexOf(status)
  return statusOrder[(idx + 1) % statusOrder.length]
}

export function GoalBoard({
  goals,
  entries,
  onCycleStatus,
  onAddJournal,
}: {
  goals: Goal[]
  entries: GoalJournalEntry[]
  onCycleStatus: (goal: Goal) => Promise<void>
  onAddJournal: (goalId: string, text: string) => Promise<void>
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-1">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          entries={entries}
          onCycleStatus={() => onCycleStatus({ ...goal, status: nextStatus(goal.status) })}
          onAddJournal={(text) => onAddJournal(goal.id, text)}
        />
      ))}
    </div>
  )
}
