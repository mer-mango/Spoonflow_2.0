import type { CalendarItem } from './EventPill'
import { useContacts } from '../../hooks/useContacts'

type DayPanelProps = {
  dateKey: string
  events: CalendarItem[]
  onOpenContactInteractions: (contactId: string) => void
}

function dateFromLocalKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatPanelDate(dateKey: string) {
  return dateFromLocalKey(dateKey).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
      <path
        d="M5.4 8.6l3.2-3.2M4.7 10H3.9A2.4 2.4 0 0 1 2.2 5.9l1.2-1.2A2.4 2.4 0 0 1 6.8 8M9.3 4h.8a2.4 2.4 0 0 1 1.7 4.1l-1.2 1.2A2.4 2.4 0 0 1 7.2 6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function DayPanel({
  dateKey,
  events,
  onOpenContactInteractions,
}: DayPanelProps) {
  const { contacts } = useContacts()

  const contactNameById = new Map(
    contacts.map((contact) => [contact.id, contact.name]),
  )

  const sortedEvents = [...events].sort(
    (a, b) => +new Date(a.startTime) - +new Date(b.startTime),
  )

  return (
    <aside className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 lg:w-[300px]">
      <h2 className="font-serif text-xl text-[var(--text)]">{formatPanelDate(dateKey)}</h2>

      <p className="mt-1 text-sm text-[var(--muted)]">
        {sortedEvents.length} scheduled {sortedEvents.length === 1 ? 'item' : 'items'}
      </p>

      <div className="mt-4 space-y-2">
        {sortedEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
            No events on this day.
          </div>
        ) : (
          sortedEvents.map((event) => {
            const color = event.color ?? '#6484a1'
            const contactName = event.contactId
              ? contactNameById.get(event.contactId) ?? null
              : null

            return (
              <article
                key={`${event.id}-${event.startTime}`}
                className="rounded-xl border border-[var(--border)] bg-white p-3"
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-[var(--text)]">
                        {event.title}
                      </h3>

                      {event.meetingLink && (
                        <a
                          href={event.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f3f0] text-[var(--muted)] transition hover:bg-[#ece8e2] hover:text-[var(--text)]"
                          title="Open meeting link"
                          aria-label="Open meeting link"
                        >
                          <LinkIcon />
                        </a>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {timeLabel(event.startTime)} – {timeLabel(event.endTime)}
                      {event.calendarLabel ? ` · ${event.calendarLabel}` : ''}
                    </p>

                    {event.contactId && contactName && (
                      <button
                        type="button"
                        onClick={() => onOpenContactInteractions(event.contactId!)}
                        className="mt-2 inline-flex items-center rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92] transition hover:bg-[rgba(139,165,168,0.24)] hover:text-[#54777a]"
                        title="Open contact interactions"
                      >
                        {contactName}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>
    </aside>
  )
}
