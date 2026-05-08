import type { CalendarItem } from './EventPill'

type MonthGridProps = {
  currentMonth: Date
  events: CalendarItem[]
  selectedDateKey: string
  onSelectDate: (dateKey: string) => void
}

const weekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function eventDateKey(iso: string) {
  return dateKey(new Date(iso))
}

function startOfCalendarGrid(month: Date) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDayOfMonth)

  start.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())

  return start
}

function buildCalendarDays(month: Date) {
  const start = startOfCalendarGrid(month)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function MonthGrid({
  currentMonth,
  events,
  selectedDateKey,
  onSelectDate,
}: MonthGridProps) {
  const days = buildCalendarDays(currentMonth)
  const todayKey = dateKey(new Date())

  const eventsByDate = events.reduce<Record<string, CalendarItem[]>>((acc, event) => {
    const key = eventDateKey(event.startTime)

    acc[key] = [...(acc[key] ?? []), event]

    return acc
  }, {})

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <div className="grid grid-cols-7 border-b border-[var(--border)] bg-white">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day)
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isToday = key === todayKey
          const isSelected = key === selectedDateKey
          const dayEvents = eventsByDate[key] ?? []

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`flex min-h-[112px] flex-col items-stretch border-b border-r border-[var(--border)] p-2 text-left transition hover:bg-black/[0.02] ${
                isSelected ? 'bg-[rgba(100,132,161,0.06)]' : 'bg-white'
              }`}
            >
              <div className="mb-2 flex w-full items-start justify-start">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm ${
                    isToday
                      ? 'bg-[var(--meeting)] font-semibold text-white'
                      : isCurrentMonth
                        ? 'text-[var(--text)]'
                        : 'text-[var(--muted)] opacity-55'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="min-w-0 space-y-1">
                {dayEvents.slice(0, 3).map((event) => {
                  const color = event.color ?? '#6484a1'

                  return (
                    <div
                      key={`${event.id}-${event.startTime}`}
                      className="truncate rounded-md px-2 py-1 text-[10.5px] font-medium leading-tight"
                      style={{
                        backgroundColor: `${color}22`,
                        color,
                      }}
                      title={event.title}
                    >
                      <span className="font-semibold">{timeLabel(event.startTime)}</span>{' '}
                      {event.title}
                    </div>
                  )
                })}

                {dayEvents.length > 3 && (
                  <div className="px-2 text-[10px] text-[var(--muted)]">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
