export type CalendarItem = {
  id: string
  title: string
  startTime: string
  endTime: string
  calendarId?: string
}

function colorForEvent(event: CalendarItem) {
  if (event.calendarId === 'MEDICAL_APPTS_CALENDAR_ID') return 'var(--medical)'
  if (event.calendarId === 'VIRTUAL_APPTS_CALENDAR_ID') return 'var(--virtual)'
  return 'var(--meeting)'
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function EventPill({ event }: { event: CalendarItem }) {
  return (
    <div
      className="mb-1 flex max-w-full items-center gap-1.5 truncate rounded px-1.5 py-1 text-[10px] leading-none text-white"
      style={{ backgroundColor: colorForEvent(event) }}
      title={event.title}
    >
      <span className="truncate">{event.title}</span>
      <span className="hidden opacity-80 xl:inline">{timeLabel(event.startTime)}</span>
    </div>
  )
}
