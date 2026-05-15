import type { CalendarItem } from './EventPill'
import { useContacts } from '../../hooks/useContacts'
import { useTasks } from '../../hooks/useTasks'

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

function dateKeyFromDateValue(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return localDateKey(date)
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

function durationLabel(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  const minutes = Math.max(0, Math.round((end - start) / 60000))

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours && mins) return `${hours}h ${mins}m`
  if (hours) return `${hours}h`
  return `${mins}m`
}

function SectionHeader({
  label,
  count,
}: {
  label: string
  count: number
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h3 className="font-sans text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
        {label}
      </h3>

      <span className="rounded-full bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
        {count}
      </span>
    </div>
  )
}

export function ListView({ events }: ListViewProps) {
  const { contacts } = useContacts()
  const { tasks } = useTasks()

  const contactNameById = new Map(
    contacts.map((contact) => [contact.id, contact.name]),
  )

  const activeTasks = tasks.filter(
    (task) => !task.archived && task.status !== 'done' && Boolean(task.due_date),
  )

  const nurtureContacts = contacts.filter(
    (contact) =>
      Boolean(contact.nurture_frequency_days) &&
      Boolean(contact.next_nurture_date),
  )

  const eventsByDate = events.reduce<Record<string, CalendarItem[]>>((acc, event) => {
    const key = eventDateKey(event.startTime)

    acc[key] = [...(acc[key] ?? []), event]

    return acc
  }, {})

  const tasksByDate = activeTasks.reduce<Record<string, typeof activeTasks>>((acc, task) => {
    const key = dateKeyFromDateValue(task.due_date)
    if (!key) return acc

    acc[key] = [...(acc[key] ?? []), task]

    return acc
  }, {})

  const nurturesByDate = nurtureContacts.reduce<Record<string, typeof nurtureContacts>>(
    (acc, contact) => {
      const key = dateKeyFromDateValue(contact.next_nurture_date)
      if (!key) return acc

      acc[key] = [...(acc[key] ?? []), contact]

      return acc
    },
    {},
  )

  const sortedDateKeys = Array.from(
    new Set([
      ...Object.keys(eventsByDate),
      ...Object.keys(tasksByDate),
      ...Object.keys(nurturesByDate),
    ]),
  ).sort()

  if (sortedDateKeys.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <p className="font-serif text-xl text-[var(--text)]">Nothing scheduled yet</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Calendar events, due tasks, and nurture follow-ups will appear here.
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

        const dayTasks = tasksByDate[dateKey] ?? []
        const dayNurtures = nurturesByDate[dateKey] ?? []

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

            <div className="space-y-5">
              {dayEvents.length > 0 && (
                <section>
                  <SectionHeader label="Meetings" count={dayEvents.length} />

                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const color = event.color ?? '#6484a1'

                      return (
                        <article
                          key={`${event.id}-${event.startTime}`}
                          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3"
                          style={{ borderLeft: `4px solid ${color}` }}
                        >
                          <h3 className="truncate text-sm font-semibold text-[var(--text)]">
                            {event.title}
                          </h3>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {timeLabel(event.startTime)} (
                            {durationLabel(event.startTime, event.endTime)})
                          </p>
                        </article>
                      )
                    })}
                  </div>
                </section>
              )}

              {dayTasks.length > 0 && (
                <section>
                  <SectionHeader label="Tasks" count={dayTasks.length} />

                  <div className="space-y-2">
                    {dayTasks.map((task) => {
                      const contactName = task.contact_id
                        ? contactNameById.get(task.contact_id) ?? null
                        : null

                      return (
                        <article
                          key={task.id}
                          className="rounded-xl border border-[var(--border)] bg-white px-4 py-3"
                          style={{ borderLeft: '4px solid #c198ad' }}
                        >
                          <h3 className="text-sm font-semibold text-[var(--text)]">
                            {task.title}
                          </h3>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            Due
                            {task.estimated_minutes ? ` · ${task.estimated_minutes}m` : ''}
                          </p>

                          {contactName && (
                            <span className="mt-2 inline-flex items-center rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92]">
                              {contactName}
                            </span>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </section>
              )}

              {dayNurtures.length > 0 && (
                <section>
                  <SectionHeader label="Nurture" count={dayNurtures.length} />

                  <div className="space-y-2">
                    {dayNurtures.map((contact) => (
                      <article
                        key={contact.id}
                        className="rounded-xl border border-[var(--border)] bg-white px-4 py-3"
                        style={{ borderLeft: '4px solid #8fa790' }}
                      >
                        <h3 className="font-serif text-sm font-medium text-[var(--text)]">
                          {contact.name}
                        </h3>

                        <span className="mt-2 inline-flex items-center rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92]">
                          {contact.name}
                        </span>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
