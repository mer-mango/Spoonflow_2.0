import { NurtureCard } from './NurtureCard'
import type { NurtureContact } from '../../hooks/useNurture'

const bucketMeta = {
  Overdue: {
    className: 'overdue',
    head: 'bg-[#fdf0f0]',
    label: 'text-[var(--medical)]',
    count: 'bg-[#fbe0e0] text-[var(--medical)]',
  },
  'This Week': {
    className: 'thisweek',
    head: 'bg-[#f0f6f0]',
    label: 'text-[#5a7a60]',
    count: 'bg-[#e0f0e0] text-[#5a7a60]',
  },
  'Next Week': {
    className: 'upcoming',
    head: 'bg-[#f5f3f0]',
    label: 'text-[var(--muted)]',
    count: 'bg-[#ebe8e4] text-[var(--muted)]',
  },
  Upcoming: {
    className: 'upcoming',
    head: 'bg-[#f5f3f0]',
    label: 'text-[var(--muted)]',
    count: 'bg-[#ebe8e4] text-[var(--muted)]',
  },
}

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
  onOpen,
}: {
  contacts: NurtureContact[]
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
    <div className="flex gap-3 overflow-x-auto pb-2 max-lg:flex-col lg:items-start">
      {Object.entries(buckets).map(([name, items]) => {
        const meta = bucketMeta[name as keyof typeof bucketMeta]

        return (
          <section key={name} className="w-full shrink-0 lg:w-[280px]">
            <div
              className={`mb-2 flex items-center justify-between rounded-[9px] px-3 py-2.5 ${meta.head}`}
            >
              <h2 className={`font-['Poppins'] text-[12px] font-semibold ${meta.label}`}>
  {name}
</h2>
              <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${meta.count}`}>
                {items.length}
              </span>
            </div>

            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-3 text-center text-[11.5px] text-[#c8c5c0]">
                  No contacts
                </div>
              ) : (
                items.map((contact) => (
                  <NurtureCard
                    key={contact.id}
                    contact={contact}
                    onOpen={onOpen}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
