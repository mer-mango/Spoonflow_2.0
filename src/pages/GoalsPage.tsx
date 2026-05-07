import { useState } from 'react'
import { GoalBoard } from '../components/goals/GoalBoard'
import { GoalModal } from '../components/goals/GoalModal'
import { useToast } from '../components/shared/Toast'
import { useGoals, type Goal } from '../hooks/useGoals'

export function GoalsPage() {
  const { goals, journalEntries, isLoading, createGoal, updateGoal, addJournalEntry } = useGoals()
  const { notify } = useToast()
  const [openNewGoal, setOpenNewGoal] = useState(false)

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between rounded-2xl bg-white p-4">
        <h1 className="text-2xl">Goals</h1>
        <button
          type="button"
          className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
          onClick={() => setOpenNewGoal(true)}
        >
          + New Goal
        </button>
      </header>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-4 text-sm text-[var(--muted)]">Loading goals...</div>
      ) : (
        <GoalBoard
          goals={goals}
          entries={journalEntries}
          onCycleStatus={async (goal: Goal) => {
            await updateGoal(goal.id, { status: goal.status })
            notify('Goal status updated')
          }}
          onAddJournal={async (goalId, text) => {
            await addJournalEntry(goalId, text)
            notify('Journal entry added')
          }}
        />
      )}

      <GoalModal
        open={openNewGoal}
        onClose={() => setOpenNewGoal(false)}
        onCreate={async (payload) => {
          await createGoal(payload)
          notify('Goal created')
        }}
      />
    </section>
  )
}
