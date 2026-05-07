import { NurtureCard } from './NurtureCard'
import type { NurtureContact } from '../../hooks/useNurture'

function bucketForDate(value: string | null) {
  if (!value) return 'Upcoming'
  const now = new Date()
  const target = new Date(value)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Overdue'
  if (diff <= 7) return 'This Week'
  if (diff <= 14) return 'Next Week'
  return 'Upcoming'
}

export function NurtureBuckets({
  contacts,
  onDone,
  onOpen,
}: {
  contacts: NurtureContact[]
  onDone: (contact: NurtureContact) => void
  onOpen: (contact: NurtureContact) => void
}) {
  const buckets: Record<string, NurtureContact[]> = {
    Overdue: [],
    'This Week': [],
    'Next Week': [],
    Upcoming: [],
  }

  contacts.forEach((contact) => {
    buckets[bucketForDate(contact.next_nurture_date)].push(contact)
  })

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {Object.entries(buckets).map(([name, items]) => (
        <section key={name} className="space-y-2 rounded-2xl bg-[#f7f7f9] p-2">
          <h2 className="px-2 text-sm text-[var(--muted)]">{name}</h2>
          <div className="space-y-2">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-3 text-xs text-[var(--muted)]">
                No contacts
              </div>
            ) : (
              items.map((contact) => (
                <NurtureCard key={contact.id} contact={contact} onDone={onDone} onOpen={onOpen} />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
