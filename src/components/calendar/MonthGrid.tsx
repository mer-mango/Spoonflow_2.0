import type { CalendarItem } from './EventPill'

type WeekView = 'workweek' | 'fullweek'

type MonthGridProps = {
  currentMonth: Date
  events: CalendarItem[]
  selectedDateKey: string
  onSelectDate: (dateKey: string) => void
  weekView: WeekView
  taskCountsByDate: Record<string, number>
  contentCountsByDate: Record<string, number>
  nurtureCountsByDate: Record<string, number>
}

const fullWeekdayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const workWeekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI']

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function eventDateKey(iso: string) {
  return dateKey(new Date(iso))
}

function startOfCalendarGrid(month: Date, weekView: WeekView) {
  const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDayOfMonth)

  if (weekView === 'fullweek') {
    start.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())
    return start
  }

  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7
  start.setDate(firstDayOfMonth.getDate() - mondayOffset)

  return start
}

function buildCalendarDays(month: Date, weekView: WeekView) {
  const start = startOfCalendarGrid(month, weekView)

  if (weekView === 'fullweek') {
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start)
      date.setDate(start.getDate() + index)
      return date
    })
  }

  const days: Date[] = []

  for (let week = 0; week < 6; week += 1) {
    for (let weekday = 0; weekday < 5; weekday += 1) {
      const date = new Date(start)
      date.setDate(start.getDate() + week * 7 + weekday)
      days.push(date)
    }
  }

  return days
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function CountBadge({
  count,
  kind,
}: {
  count: number
  kind: 'tasks' | 'content' | 'nurture'
}) {
  if (!count) return null

  const badgeClass =
    kind === 'tasks'
      ? 'bg-[rgba(193,152,173,0.16)] text-[#9f6e89]'
      : kind === 'content'
        ? 'bg-[rgba(226,183,190,0.18)] text-[#c78390]'
        : 'bg-[rgba(143,167,144,0.18)] text-[#6f8d70]'

  const title =
    kind === 'tasks'
      ? `${count} task${count === 1 ? '' : 's'} due`
      : kind === 'content'
        ? `${count} content item${count === 1 ? '' : 's'} due`
        : `${count} nurture follow-up${count === 1 ? '' : 's'} due`

  return (
    <span
      className={`min-w-[18px] rounded-[7px] px-1.5 py-0.5 text-center text-[10px] font-semibold ${badgeClass}`}
      title={title}
      aria-label={title}
    >
      {count}
    </span>
  )
}

export function MonthGrid({
  currentMonth,
  events,
  selectedDateKey,
  onSelectDate,
  weekView,
  taskCountsByDate,
  contentCountsByDate,
  nurtureCountsByDate,
}: MonthGridProps) {
  const days = buildCalendarDays(currentMonth, weekView)
  const todayKey = dateKey(new Date())
  const weekdayLabels = weekView === 'workweek' ? workWeekdayLabels : fullWeekdayLabels
  const gridColumnClass = weekView === 'workweek' ? 'grid-cols-5' : 'grid-cols-7'

  const eventsByDate = events.reduce<Record<string, CalendarItem[]>>((acc, event) => {
    const key = eventDateKey(event.startTime)

    acc[key] = [...(acc[key] ?? []), event]

    return acc
  }, {})

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-white">
      <div className={`grid ${gridColumnClass} border-b border-[var(--border)] bg-white`}>
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            {label}
          </div>
        ))}
      </div>

      <div className={`grid ${gridColumnClass}`}>
        {days.map((day) => {
          const key = dateKey(day)
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isToday = key === todayKey
          const isSelected = key === selectedDateKey
          const dayEvents = eventsByDate[key] ?? []

          const taskCount = taskCountsByDate[key] ?? 0
          const contentCount = contentCountsByDate[key] ?? 0
          const nurtureCount = nurtureCountsByDate[key] ?? 0

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(key)}
              className={`flex ${
                weekView === 'workweek' ? 'min-h-[136px]' : 'min-h-[112px]'
              } flex-col items-stretch border-b border-r border-[var(--border)] p-2 text-left transition hover:bg-black/[0.02] ${
                isSelected ? 'bg-[rgba(100,132,161,0.06)]' : 'bg-white'
              }`}
            >
              <div className="mb-2 flex w-full items-start justify-between gap-2">
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

                <div className="flex flex-wrap items-center justify-end gap-1">
                  <CountBadge count={taskCount} kind="tasks" />
                  <CountBadge count={contentCount} kind="content" />
                  <CountBadge count={nurtureCount} kind="nurture" />
                </div>
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
