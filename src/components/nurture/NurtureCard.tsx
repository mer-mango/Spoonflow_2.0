import type { NurtureContact } from '../../hooks/useNurture'

function daysUntil(value: string | null) {
  if (!value) return null
  const today = new Date()
  const target = new Date(value)
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function NurtureCard({
  contact,
  onDone,
  onOpen,
}: {
  contact: NurtureContact
  onDone: (contact: NurtureContact) => void
  onOpen: (contact: NurtureContact) => void
}) {
  const delta = daysUntil(contact.next_nurture_date)
  const overdue = typeof delta === 'number' && delta < 0

  return (
    <article
      className={`rounded-xl border bg-white p-3 ${overdue ? 'border-[var(--medical)]' : 'border-[var(--border)]'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <button type="button" className="text-left" onClick={() => onOpen(contact)}>
          <p className="font-medium">{contact.name}</p>
          <p className="text-sm text-[var(--muted)]">{contact.email || 'No email'}</p>
        </button>
        <button
          type="button"
          className="rounded-lg bg-[var(--nurture)] px-2 py-1 text-xs text-white"
          onClick={() => onDone(contact)}
        >
          ✓ Done
        </button>
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">
        {delta === null
          ? 'No check-in date'
          : overdue
            ? `${Math.abs(delta)}d overdue`
            : `${delta}d away`}
      </p>
    </article>
  )
}
