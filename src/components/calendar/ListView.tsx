import type { CalendarItem } from './EventPill'

function monthDayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function ListView({ events }: { events: CalendarItem[] }) {
  const sorted = [...events].sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
  const groups = new Map<string, CalendarItem[]>()
  for (const event of sorted) {
    const key = monthDayKey(event.startTime)
    groups.set(key, [...(groups.get(key) ?? []), event])
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {Array.from(groups.entries()).map(([dateKey, dayEvents]) => (
          <section key={dateKey} className="rounded-[10px] border-[0.5px] border-[var(--border)] bg-white p-4">
            <h3 className="mb-3 font-serif text-[16px] font-medium">{new Date(dateKey).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <article key={event.id} className="flex items-start gap-3 rounded-[9px] border-[0.5px] border-[var(--border)] p-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-[var(--meeting)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{event.title}</p>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{timeLabel(event.startTime)} – {timeLabel(event.endTime)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        {events.length === 0 && <p className="rounded-[10px] border-[0.5px] border-dashed border-[var(--border)] bg-white p-5 text-center text-[12px] text-[var(--muted)]">No events yet.</p>}
      </div>
    </div>
  )
}
