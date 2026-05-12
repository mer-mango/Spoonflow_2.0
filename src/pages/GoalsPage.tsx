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
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <div><h1 className="font-serif text-[26px] font-medium tracking-[-0.4px]">Goals</h1>
        </div>
        <button type="button" className="rounded-full bg-[var(--goals)] px-4 py-2 text-[11.5px] font-medium text-white" onClick={() => setOpenNewGoal(true)}>+ New Goal</button>
      </header>
      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        {(['All','Active','Completed','Archived'] as const).map((filter) => <button key={filter} type="button" className="rounded-full border-[0.5px] border-[var(--border)] bg-white px-3 py-1.5 text-[11.5px] text-[var(--muted)] hover:border-[var(--goals)] hover:text-[var(--goals)]">{filter}</button>)}
        <span className="ml-auto text-[11px] text-[var(--muted)]">{goals.length} goals</span>
      </div>
      <div className="p-4">{isLoading ? <p className="text-[12px] text-[var(--muted)]">Loading goals…</p> : <GoalBoard goals={goals} entries={journalEntries} onCycleStatus={async (goal: Goal) => { await updateGoal(goal.id, { status: goal.status }); notify('Goal status updated') }} onAddJournal={async (goalId, text) => { await addJournalEntry(goalId, text); notify('Journal entry added') }} />}</div>
      <GoalModal open={openNewGoal} onClose={() => setOpenNewGoal(false)} onCreate={async (payload) => { await createGoal(payload); notify('Goal created') }} />
    </section>
  )
}
