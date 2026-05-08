export type CalendarItem = {
  id: string
  title: string
  startTime: string
  endTime: string
  calendarId?: string
  calendarLabel?: string
  color?: string
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function EventPill({ event }: { event: CalendarItem }) {
  const color = event.color ?? '#6484a1'

  return (
    <div
      className="truncate rounded-md px-2 py-1 text-[10.5px] font-medium leading-tight"
      style={{
        backgroundColor: `${color}22`,
        color,
      }}
      title={`${event.title}${event.calendarLabel ? ` · ${event.calendarLabel}` : ''}`}
    >
      <span className="font-semibold">{timeLabel(event.startTime)}</span>{' '}
      {event.title}
    </div>
  )
}
