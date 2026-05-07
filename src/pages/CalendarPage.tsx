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
    () => enrichedCalendarEvents.map((event) => ({ id: event.id, title: event.title, startTime: event.startTime, endTime: event.endTime, calendarId: event.calendarId })),
    [enrichedCalendarEvents],
  )

  const selectedDayEvents = useMemo(() => events.filter((event) => event.startTime.slice(0, 10) === selectedDateKey), [events, selectedDateKey])

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <div>
          <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">Calendar</h1>
          <p className="mt-0.5 text-[11px] text-[var(--muted)]">Google Calendar, meetings, medical appointments, and working blocks.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-white px-5 py-3">
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-[7px] border-[0.5px] border-[var(--border)] bg-white hover:bg-[#f5f3f0]" onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}>‹</button>
        <p className="min-w-[120px] text-center text-[14px] font-medium">{currentMonth.toLocaleDateString([], { month: 'long', year: 'numeric' })}</p>
        <button type="button" className="flex h-7 w-7 items-center justify-center rounded-[7px] border-[0.5px] border-[var(--border)] bg-white hover:bg-[#f5f3f0]" onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}>›</button>
        <button type="button" className="ml-1 rounded-[7px] border-[0.5px] border-[var(--border)] bg-white px-3 py-1.5 text-[12px] hover:bg-[#f5f3f0]" onClick={() => setCurrentMonth(new Date())}>Today</button>
        <button type="button" className="rounded-[7px] bg-[var(--meeting)] px-3 py-1.5 text-[12px] text-white hover:bg-[#537898]">Sync</button>
        <div className="ml-auto flex rounded-lg border-[0.5px] border-[var(--border)] bg-[var(--bg)] p-[3px]">
          <button type="button" className={`rounded-md px-3 py-1.5 text-[11.5px] ${view === 'month' ? 'bg-white text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.09)]' : 'text-[var(--muted)]'}`} onClick={() => setView('month')}>Month</button>
          <button type="button" className={`rounded-md px-3 py-1.5 text-[11.5px] ${view === 'list' ? 'bg-white text-[var(--text)] shadow-[0_1px_4px_rgba(0,0,0,0.09)]' : 'text-[var(--muted)]'}`} onClick={() => setView('list')}>List</button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-4 text-[12px] text-[var(--muted)]">Loading calendar…</div>
      ) : view === 'list' ? (
        <ListView events={events} />
      ) : (
        <div className="flex flex-col overflow-hidden lg:flex-row">
          <div className="min-w-0 flex-1 overflow-hidden">
            <MonthGrid currentMonth={currentMonth} events={events} selectedDateKey={selectedDateKey} onSelectDate={setSelectedDateKey} />
          </div>
          <DayPanel dateKey={selectedDateKey} events={selectedDayEvents} />
        </div>
      )}
    </section>
  )
}
