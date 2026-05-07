import { useMemo, useState } from 'react'
import { DayPanel } from '../components/calendar/DayPanel'
import { ListView } from '../components/calendar/ListView'
import { MonthGrid } from '../components/calendar/MonthGrid'
import type { CalendarItem } from '../components/calendar/EventPill'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'

function isoDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function CalendarPage() {
  const { enrichedCalendarEvents, isLoading } = useGoogleCalendar()
  const [view, setView] = useState<'month' | 'list'>('month')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(() => isoDateKey(new Date()))

  const events: CalendarItem[] = useMemo(
    () =>
      enrichedCalendarEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        calendarId: event.calendarId,
      })),
    [enrichedCalendarEvents],
  )

  const selectedDayEvents = useMemo(
    () => events.filter((event) => event.startTime.slice(0, 10) === selectedDateKey),
    [events, selectedDateKey],
  )

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
            >
              Prev
            </button>
            <p className="min-w-[150px] text-center text-sm">
              {currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              className="rounded-lg border border-[var(--border)] px-3 py-2"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            >
              Next
            </button>
            <div className="ml-2 overflow-hidden rounded-lg border border-[var(--border)]">
              <button
                type="button"
                className={`px-3 py-2 text-sm ${view === 'month' ? 'bg-[var(--jamie)] text-white' : 'bg-white'}`}
                onClick={() => setView('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-[var(--jamie)] text-white' : 'bg-white'}`}
                onClick={() => setView('list')}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-4 text-sm text-[var(--muted)]">Loading calendar...</div>
      ) : view === 'list' ? (
        <ListView events={events} />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 rounded-2xl bg-white p-4">
            <MonthGrid
              currentMonth={currentMonth}
              events={events}
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
            />
          </div>
          <DayPanel dateKey={selectedDateKey} events={selectedDayEvents} />
        </div>
      )}
    </section>
  )
}
