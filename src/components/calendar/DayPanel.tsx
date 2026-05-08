import type { CalendarItem } from './EventPill'

type DayPanelProps = {
  dateKey: string
  events: CalendarItem[]
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

export function DayPanel({ dateKey, events }: DayPanelProps) {
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

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[var(--text)]">
                      {event.title}
                    </h3>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {timeLabel(event.startTime)} – {timeLabel(event.endTime)}
                      {event.calendarLabel ? ` · ${event.calendarLabel}` : ''}
                    </p>
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
