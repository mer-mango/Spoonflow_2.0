import type { CalendarItem } from './EventPill'

type ListViewProps = {
  events: CalendarItem[]
}

function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function eventDateKey(iso: string) {
  return localDateKey(new Date(iso))
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ListView({ events }: ListViewProps) {
  const eventsByDate = events.reduce<Record<string, CalendarItem[]>>((acc, event) => {
    const key = eventDateKey(event.startTime)

    acc[key] = [...(acc[key] ?? []), event]

    return acc
  }, {})

  const sortedDateKeys = Object.keys(eventsByDate).sort()

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <p className="font-serif text-xl text-[var(--text)]">No calendar events found</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Try syncing your calendar or reconnecting Google Calendar in Settings.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sortedDateKeys.map((dateKey) => {
        const dayEvents = [...(eventsByDate[dateKey] ?? [])].sort(
          (a, b) => +new Date(a.startTime) - +new Date(b.startTime),
        )

        return (
          <section
            key={dateKey}
            className="rounded-2xl border border-[var(--border)] bg-white p-5"
          >
            <header className="mb-4">
              <h2 className="font-serif text-xl text-[var(--text)]">
                {formatDateLabel(dateKey)}
              </h2>
            </header>

            <div className="space-y-2">
              {dayEvents.map((event) => {
                const color = event.color ?? '#6484a1'

                return (
                  <article
                    key={`${event.id}-${event.startTime}`}
                    className="rounded-xl border border-[var(--border)] bg-white px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                          <h3 className="truncate text-sm font-semibold text-[var(--text)]">
                            {event.title}
                          </h3>

                          {event.calendarLabel && (
                            <span
                              className="w-fit rounded-full px-2 py-1 text-[10px] font-semibold"
                              style={{
                                backgroundColor: `${color}22`,
                                color,
                              }}
                            >
                              {event.calendarLabel}
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {timeLabel(event.startTime)} – {timeLabel(event.endTime)}
                        </p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
