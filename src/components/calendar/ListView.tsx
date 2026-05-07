import type { CalendarItem } from './EventPill'

function monthDayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ListView({ events }: { events: CalendarItem[] }) {
  const sorted = [...events].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
  const groups = new Map<string, CalendarItem[]>()
  for (const event of sorted) {
    const key = monthDayKey(event.startTime)
    groups.set(key, [...(groups.get(key) ?? []), event])
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-4">
      {Array.from(groups.entries()).map(([dateKey, dayEvents]) => (
        <section key={dateKey}>
          <h3 className="mb-2 text-sm text-[var(--muted)]">{new Date(dateKey).toDateString()}</h3>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <article key={event.id} className="rounded-xl border border-[var(--border)] p-3">
                <p className="font-medium">{event.title}</p>
                <p className="text-xs text-[var(--muted)]">
                  {timeLabel(event.startTime)} - {timeLabel(event.endTime)}
                </p>
              </article>
            ))}
          </div>
        </section>
      ))}
      {events.length === 0 && <p className="text-sm text-[var(--muted)]">No events yet.</p>}
    </div>
  )
}
