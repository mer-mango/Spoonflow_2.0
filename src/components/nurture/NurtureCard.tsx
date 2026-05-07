import type { NurtureContact } from '../../hooks/useNurture'

function daysUntil(value: string | null) {
  if (!value) return null
  const today = new Date()
  const target = new Date(value)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function initials(name: string) {
  return name.split(' ').map((part) => part[0] ?? '').join('').slice(0, 2).toUpperCase()
}

function dateLabel(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function NurtureCard({ contact, onDone, onOpen }: { contact: NurtureContact; onDone: (contact: NurtureContact) => void; onOpen: (contact: NurtureContact) => void }) {
  const delta = daysUntil(contact.next_nurture_date)
  const overdue = typeof delta === 'number' && delta < 0

  return (
    <article className={`relative cursor-pointer rounded-[9px] border-[0.5px] bg-white p-3 transition hover:border-[rgba(143,167,144,0.35)] hover:bg-[#f8fdf8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${overdue ? 'border-l-[3px] border-l-[var(--medical)] border-[var(--border)]' : 'border-[var(--border)]'}`} onClick={() => onOpen(contact)}>
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 min-w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white" style={{ backgroundColor: contact.color ?? '#8ba5a8' }}>{initials(contact.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium leading-tight text-[var(--meeting)]">{contact.name}</p>
          <p className="mt-0.5 truncate text-[10.5px] text-[var(--muted)]">{contact.email || 'No email'}</p>
        </div>
        <button type="button" className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full border-[1.5px] border-[#c8c5c0] text-[11px] text-[var(--nurture)] hover:border-[var(--nurture)] hover:bg-[var(--nurture)] hover:text-white" onClick={(event) => { event.stopPropagation(); onDone(contact) }} aria-label="Mark nurture done">✓</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10.5px] text-[var(--muted)]">
        <span className={`rounded px-2 py-1 ${overdue ? 'bg-[#fdf0f0] text-[var(--medical)]' : 'bg-[#f0f6f0] text-[#5a7a60]'}`}>{delta === null ? 'No check-in date' : overdue ? `${Math.abs(delta)}d overdue` : `${delta}d away`}</span>
        <span className="rounded bg-[#f5f3f0] px-2 py-1">Every {contact.nurture_frequency_days ?? '—'}d</span>
      </div>
      <p className="mt-2 text-[10.5px] text-[var(--muted)]">Last meeting: {dateLabel(contact.next_call_date)}</p>
      <details className="mt-3 rounded-[7px] bg-[#faf9f8] px-2 py-1.5 text-[11px] text-[var(--muted)]">
        <summary className="cursor-pointer text-[var(--nurture)]">✦ Context from last interaction</summary>
        <p className="mt-1 leading-relaxed">Generate context with Jamie to prep a thoughtful follow-up.</p>
      </details>
    </article>
  )
}
