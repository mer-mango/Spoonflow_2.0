import { useMemo, useState } from 'react'
import type { GoalJournalEntry } from '../../hooks/useGoals'

export function JournalTab({
  goalId,
  entries,
  onAdd,
}: {
  goalId: string
  entries: GoalJournalEntry[]
  onAdd: (text: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const goalEntries = useMemo(() => entries.filter((entry) => entry.goal_id === goalId), [entries, goalId])

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={2}
          placeholder="Journal update"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-lg bg-[var(--jamie)] px-3 py-2 text-sm text-white"
          onClick={async () => {
            if (!value.trim()) return
            await onAdd(value.trim())
            setValue('')
          }}
        >
          Add
        </button>
      </div>
      <div className="space-y-2">
        {goalEntries.map((entry) => (
          <article key={entry.id} className="rounded-lg border border-[var(--border)] p-2 text-sm">
            <p>{entry.text}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              {new Date(entry.created_at).toLocaleString()}
            </p>
          </article>
        ))}
        {goalEntries.length === 0 && <p className="text-xs text-[var(--muted)]">No journal entries yet.</p>}
      </div>
    </div>
  )
}
