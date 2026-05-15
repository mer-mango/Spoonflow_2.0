import { useMemo, useState } from 'react'
import { DayPanel } from '../components/calendar/DayPanel'
import { ListView } from '../components/calendar/ListView'
import { MonthGrid } from '../components/calendar/MonthGrid'
import type { CalendarItem } from '../components/calendar/EventPill'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { useTasks } from '../hooks/useTasks'
import { useContacts } from '../hooks/useContacts'

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function eventDateKey(iso: string) {
  return localDateKey(new Date(iso))
}

function dateKeyFromDateValue(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return localDateKey(date)
}

function addMonths(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

export function CalendarPage() {
  const { enrichedCalendarEvents, isLoading, syncCalendar } = useGoogleCalendar()
  const { tasks } = useTasks()
  const { contacts } = useContacts()
  
  const [view, setView] = useState<'month' | 'list'>('month')
  const [weekView, setWeekView] = useState<'workweek' | 'fullweek'>('workweek')
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedDateKey, setSelectedDateKey] = useState(() => localDateKey(new Date()))

  const events: CalendarItem[] = useMemo(
    () =>
      enrichedCalendarEvents.map((event) => ({
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        calendarId: event.calendarId,
        color: event.color,
        calendarLabel: event.calendarLabel,
        contactId: event.contactDetails?.id ?? null,
        meetingLink: event.meetingLink ?? null,
      })),
    [enrichedCalendarEvents],
  )

  const selectedDayEvents = useMemo(
    () => events.filter((event) => eventDateKey(event.startTime) === selectedDateKey),
    [events, selectedDateKey],
  )
  const taskCountsByDate = useMemo(() => {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    if (task.archived || task.status === 'done') return acc

    const key = dateKeyFromDateValue(task.due_date)
    if (!key) return acc

    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}, [tasks])

    const nurtureCountsByDate = useMemo(() => {
      return contacts.reduce<Record<string, number>>((acc, contact) => {
        if (!contact.nurture_frequency_days) return acc
    
        const key = dateKeyFromDateValue(contact.next_nurture_date)
        if (!key) return acc
    
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
    }, [contacts])
    
    const contentCountsByDate = useMemo<Record<string, number>>(() => {
      return {}
    }, [])
    
      const monthLabel = currentMonth.toLocaleDateString([], {
      month: 'long',
      year: 'numeric',
    })

  return (
  <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-white">
    <header className="border-b-[0.5px] border-[var(--border)] bg-white">
      <div className="border-b-[0.5px] border-[var(--border)] px-5 py-5">
        <h1 className="font-serif text-[26px] font-medium tracking-[-0.4px]">
          Calendar
        </h1>
    
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-sm hover:bg-black/[0.03]"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, -1))}
            aria-label="Previous month"
          >
            ‹
          </button>

          <h2 className="min-w-[140px] text-center text-lg font-semibold">
            {monthLabel}
          </h2>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-sm hover:bg-black/[0.03]"
            onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
            aria-label="Next month"
          >
            ›
          </button>

          <button
            type="button"
            className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm hover:bg-black/[0.03]"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </button>

          <button
            type="button"
            className="rounded-lg bg-[var(--meeting)] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void syncCalendar()}
          >
            Sync
          </button>
        </div>

        <div className="flex items-center gap-2">
  {view === 'month' && (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white p-1">
      <button
        type="button"
        className={`rounded-md px-3 py-2 text-sm ${
          weekView === 'workweek'
            ? 'bg-[var(--bg)] text-[var(--text)]'
            : 'text-[var(--muted)] hover:bg-black/[0.03]'
        }`}
        onClick={() => setWeekView('workweek')}
      >
        M–F
      </button>

      <button
        type="button"
        className={`rounded-md px-3 py-2 text-sm ${
          weekView === 'fullweek'
            ? 'bg-[var(--bg)] text-[var(--text)]'
            : 'text-[var(--muted)] hover:bg-black/[0.03]'
        }`}
        onClick={() => setWeekView('fullweek')}
      >
        S–S
      </button>
    </div>
  )}

  <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white p-1">
    <button
      type="button"
      className={`rounded-md px-4 py-2 text-sm ${
        view === 'month'
          ? 'bg-[var(--bg)] text-[var(--text)]'
          : 'text-[var(--muted)] hover:bg-black/[0.03]'
      }`}
      onClick={() => setView('month')}
    >
      Month
    </button>

    <button
      type="button"
      className={`rounded-md px-4 py-2 text-sm ${
        view === 'list'
          ? 'bg-[var(--bg)] text-[var(--text)]'
          : 'text-[var(--muted)] hover:bg-black/[0.03]'
      }`}
      onClick={() => setView('list')}
    >
      List
    </button>
  </div>
</div>
      </div>
    </header>

    <div className="bg-[var(--bg)] px-5 py-4">
      {isLoading ? (
        <div className="rounded-xl border-[0.5px] border-[var(--border)] bg-white p-5 text-sm text-[var(--muted)]">
          Loading calendar...
        </div>
      ) : view === 'list' ? (
        <ListView events={events} />
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <MonthGrid
              currentMonth={currentMonth}
              events={events}
              selectedDateKey={selectedDateKey}
              onSelectDate={setSelectedDateKey}
              weekView={weekView}
              taskCountsByDate={taskCountsByDate}
              contentCountsByDate={contentCountsByDate}
              nurtureCountsByDate={nurtureCountsByDate}
            />
          </div>

          <DayPanel
              dateKey={selectedDateKey}
              events={selectedDayEvents}
            />
        </div>
      )}
    </div>
  </section>
)
}
