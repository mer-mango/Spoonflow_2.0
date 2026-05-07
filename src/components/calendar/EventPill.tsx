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

export function EventPill({ event }: { event: CalendarItem }) {
  return (
    <div
      className="truncate rounded-full px-2 py-1 text-xs text-white"
      style={{ backgroundColor: colorForEvent(event) }}
      title={event.title}
    >
      {event.title}
    </div>
  )
}
