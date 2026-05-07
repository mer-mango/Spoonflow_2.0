import { EventPill, type CalendarItem } from './EventPill'

type DayCell = {
  date: Date
  key: string
  inMonth: boolean
  events: CalendarItem[]
}

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
  const todayKey = dateKey(new Date())
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
    <div className="overflow-x-auto p-3">
      <div className="grid min-w-[700px] grid-cols-7 overflow-hidden rounded-[10px] border-[0.5px] border-[var(--border)] bg-white">
        {dayLabels.map((label) => (
          <div key={label} className="border-b-[0.5px] border-[var(--border)] bg-white py-2 text-center text-[10px] font-medium uppercase tracking-[0.04em] text-[var(--muted)]">
            {label}
          </div>
        ))}
        {cells.map((cell, index) => (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectDate(cell.key)}
            className={`min-h-[82px] min-w-0 border-b-[0.5px] border-r-[0.5px] border-[var(--border)] p-1.5 text-left transition-colors hover:bg-[#faf9f8] ${
              (index + 1) % 7 === 0 ? 'border-r-0' : ''
            } ${selectedDateKey === cell.key ? 'bg-[#f0edf4]' : ''} ${cell.inMonth ? 'bg-white' : 'bg-[#faf9f8] opacity-55'}`}
          >
            <span className={`mb-1 flex h-5 w-5 items-center justify-center text-[11px] font-medium ${cell.key === todayKey ? 'rounded-full bg-[var(--meeting)] text-white' : 'text-[var(--text)]'}`}>
              {cell.date.getDate()}
            </span>
            <div>
              {cell.events.slice(0, 3).map((event) => (
                <EventPill key={event.id} event={event} />
              ))}
              {cell.events.length > 3 && <p className="text-[10px] text-[var(--muted)]">+{cell.events.length - 3} more</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
