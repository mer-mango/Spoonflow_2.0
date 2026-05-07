import { EventPill, type CalendarItem } from './EventPill'

type DayCell = {
  date: Date
  key: string
  inMonth: boolean
  events: CalendarItem[]
}

function startOfMonthGrid(currentMonth: Date) {
  const first = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const day = first.getDay()
  first.setDate(first.getDate() - day)
  return first
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

export function MonthGrid({
  currentMonth,
  events,
  selectedDateKey,
  onSelectDate,
}: {
  currentMonth: Date
  events: CalendarItem[]
  selectedDateKey: string
  onSelectDate: (key: string) => void
}) {
  const byDay = new Map<string, CalendarItem[]>()
  for (const event of events) {
    const key = event.startTime.slice(0, 10)
    byDay.set(key, [...(byDay.get(key) ?? []), event])
  }

  const cells: DayCell[] = []
  const cursor = startOfMonthGrid(currentMonth)
  for (let i = 0; i < 42; i += 1) {
    const day = new Date(cursor)
    const key = dateKey(day)
    cells.push({
      date: day,
      key,
      inMonth: day.getMonth() === currentMonth.getMonth(),
      events: byDay.get(key) ?? [],
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return (
    <div className="min-w-[700px] overflow-x-auto">
      <div className="grid grid-cols-7 gap-2">
        {cells.map((cell) => (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectDate(cell.key)}
            className={`min-h-[110px] rounded-xl border p-2 text-left ${
              selectedDateKey === cell.key ? 'border-[var(--jamie)]' : 'border-[var(--border)]'
            } ${cell.inMonth ? 'bg-white' : 'bg-black/5'}`}
          >
            <p className="mb-2 text-xs text-[var(--muted)]">{cell.date.getDate()}</p>
            <div className="space-y-1">
              {cell.events.slice(0, 3).map((event) => (
                <EventPill key={event.id} event={event} />
              ))}
              {cell.events.length > 3 && (
                <p className="text-xs text-[var(--muted)]">+{cell.events.length - 3} more</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
