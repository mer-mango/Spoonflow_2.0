import type { CalendarItem } from './EventPill'

function toTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function DayPanel({ dateKey, events }: { dateKey: string; events: CalendarItem[] }) {
  return (
    <aside className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 lg:w-[260px]">
      <h2 className="text-lg">{new Date(dateKey).toDateString()}</h2>
      <div className="mt-3 space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No events on this day.</p>
        ) : (
          events.map((event) => (
            <article key={event.id} className="rounded-xl border border-[var(--border)] p-2">
              <p className="text-sm font-medium">{event.title}</p>
              <p className="text-xs text-[var(--muted)]">
                {toTimeLabel(event.startTime)} - {toTimeLabel(event.endTime)}
              </p>
            </article>
          ))
        )}
      </div>
    </aside>
  )
}
