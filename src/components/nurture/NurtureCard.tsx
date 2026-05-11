import type { NurtureContact } from '../../hooks/useNurture'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function dateLabel(date: string | null) {
  if (!date) return 'No date'

  return new Date(date).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function frequencyLabel(days: number | null) {
  if (!days) return '—'

  const weeks = Math.round(days / 7)

  if (weeks >= 1 && days % 7 === 0) {
    return `${weeks} wks`
  }

  return `${days}d`
}

function isOverdue(value: string | null) {
  if (!value) return false

  const today = new Date()
  const target = new Date(value)

  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  return target.getTime() < today.getTime()
}

export function NurtureCard({
  contact,
  onOpen,
}: {
  contact: NurtureContact
  onOpen: (contact: NurtureContact) => void
}) {
  const overdue = isOverdue(contact.next_nurture_date)

  return (
    <article
      className={`relative cursor-pointer rounded-[9px] border-[0.5px] bg-white p-2.5 transition hover:border-[rgba(143,167,144,0.35)] hover:bg-[#f8fdf8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${
        overdue
          ? 'border-l-[3px] border-l-[var(--medical)] border-[var(--border)]'
          : 'border-[var(--border)]'
      }`}
      onClick={() => onOpen(contact)}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 min-w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white"
          style={{ backgroundColor: contact.color ?? '#8ba5a8' }}
        >
          {initials(contact.name)}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold leading-tight text-[var(--meeting)]">
            {contact.name}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-[#f5f3f0] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
              {frequencyLabel(contact.nurture_frequency_days)}
            </span>

            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                overdue ? 'bg-[#fdf0f0] text-[var(--medical)]' : 'bg-[#f0f6f0] text-[#5a7a60]'
              }`}
            >
              {dateLabel(contact.next_nurture_date)}
            </span>
          </div>
        </div>

        <span className="rounded-full bg-[rgba(143,167,144,0.12)] px-2 py-1 text-[10px] font-medium text-[var(--nurture)]">
          Log
        </span>
      </div>
    </article>
  )
}
