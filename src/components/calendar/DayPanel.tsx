import type { CalendarItem } from './EventPill'

function toTimeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function DayPanel({ dateKey, events }: { dateKey: string; events: CalendarItem[] }) {
  return (
    <aside className="w-full shrink-0 border-t-[0.5px] border-[var(--border)] bg-white p-4 lg:w-[260px] lg:border-l-[0.5px] lg:border-t-0">
      <p className="font-serif text-[17px] font-medium tracking-[-0.2px] text-[var(--text)]">{new Date(dateKey).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{events.length} scheduled item{events.length === 1 ? '' : 's'}</p>
      <div className="mt-4 space-y-2">
        {events.length === 0 ? (
          <p className="rounded-[9px] border-[0.5px] border-dashed border-[var(--border)] bg-[#faf9f8] p-3 text-[11.5px] text-[#c8c5c0]">No events on this day.</p>
        ) : (
          events.map((event) => (
            <article key={event.id} className="rounded-[9px] border-[0.5px] border-[var(--border)] bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[12.5px] font-medium leading-snug">{event.title}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">{toTimeLabel(event.startTime)} – {toTimeLabel(event.endTime)}</p>
            </article>
          ))
        )}
      </div>
    </aside>
  )
}
