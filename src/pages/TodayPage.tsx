import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AddActivityModal } from '../components/today/AddActivityModal'
import type { TimelineActivity } from '../components/today/TimelineBlock'
import { useContacts } from '../hooks/useContacts'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useTasks, type Task } from '../hooks/useTasks'

const MEDICAL_CALENDAR_ID = import.meta.env.VITE_GOOGLE_MEDICAL_CALENDAR_ID
const VIRTUAL_CALENDAR_ID = import.meta.env.VITE_GOOGLE_VIRTUAL_CALENDAR_ID

type WidgetId = 'meetings' | 'tasks' | 'nurture' | 'content'

type TimelineDisplayItem = {
  id: string
  type: TimelineActivity['type']
  title: string
  start: string
  end: string
  durationMinutes: number
  isManual: boolean
  isJamieAdded?: boolean
}

const activityColors: Record<string, string> = {
  meeting: '#6484a1',
  medical: '#c9888e',
  virtual: '#d4a77a',
  task: '#c198ad',
  tasks: '#c198ad',
  content: '#e2b7be',
  nurture: '#8fa790',
  break: '#c8c5c0',
  brk: '#c8c5c0',
  email: '#b8a7c9',
  pt: '#bcd1d5',
  prodev: '#93738e',
  'professional-dev': '#9eafa4',
  lunch: '#d4b5a0',
  winddown: '#93738e',
  'wind-down': '#93738e',
  custom: '#b0b5ba',
}

function todayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function todayLongLabel() {
  return new Date().toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function localDateKeyFromIso(iso: string) {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toTimeLabel(iso: string) {
  const date = new Date(iso)

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function calendarTypeForEvent(calendarId?: string | null): TimelineActivity['type'] {
  if (calendarId && MEDICAL_CALENDAR_ID && calendarId === MEDICAL_CALENDAR_ID) {
    return 'medical'
  }

  if (calendarId && VIRTUAL_CALENDAR_ID && calendarId === VIRTUAL_CALENDAR_ID) {
    return 'virtual'
  }

  return 'meeting'
}

function dateKeyFromDateValue(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  try {
    return localDateKeyFromIso(value)
  } catch {
    return null
  }
}

function isActiveTask(task: Task) {
  return task.status !== 'done' && !task.archived
}

function isTodayDate(value: string | null | undefined, todayKey: string) {
  return dateKeyFromDateValue(value) === todayKey
}

function isOverdueDate(value: string | null | undefined, todayKey: string) {
  const dateKey = dateKeyFromDateValue(value)
  if (!dateKey) return false

  return dateKey < todayKey
}

function formatDueLabel(value?: string | null) {
  const dateKey = dateKeyFromDateValue(value)
  if (!dateKey) return 'No due date'

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function statusLabel(status: Task['status']) {
  if (status === 'toDo') return 'To Do'
  if (status === 'inProgress') return 'In Progress'
  if (status === 'awaitingReply') return 'Awaiting Reply'
  return 'Done'
}

function statusPillClass(status: Task['status']) {
  if (status === 'toDo') return 'bg-[rgba(193,152,173,0.16)] text-[#9f6e89]'
  if (status === 'inProgress') return 'bg-[rgba(100,132,161,0.16)] text-[#6484a1]'
  if (status === 'awaitingReply') return 'bg-[#eee9e1] text-[#7f786f]'
  return 'bg-[rgba(143,167,144,0.18)] text-[#6f8d70]'
}

function taskTypeLabel(value?: string | null) {
  if (!value) return null

  const labels: Record<string, string> = {
    admin: 'Admin',
    outreach: 'Outreach',
    client_work: 'Client Work',
    business_development: 'Business Dev',
    schedule: 'Schedule',
    other: 'Other',
  }

  return labels[value] ?? value
}

function minutesFromTimeLabel(label: string) {
  const trimmed = label.trim()

  if (/^\d{2}:\d{2}$/.test(trimmed)) {
    const [hour, minute] = trimmed.split(':').map(Number)
    return hour * 60 + minute
  }

  const [timePart, meridiemRaw] = trimmed.split(' ')
  const [hourRaw, minuteRaw] = timePart.split(':')
  const meridiem = meridiemRaw?.toLowerCase()

  let hour = Number(hourRaw)
  const minute = Number(minuteRaw ?? 0)

  if (meridiem === 'pm' && hour !== 12) hour += 12
  if (meridiem === 'am' && hour === 12) hour = 0

  return hour * 60 + minute
}

function timeValueFromMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59))
  const hour = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function timeLabelFromMinutes(totalMinutes: number) {
  const hour24 = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  const meridiem = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12

  return `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours && mins) return `${hours}h ${mins}m`
  if (hours) return `${hours}h`
  return `${mins}m`
}

function durationFromActivity(activity: TimelineActivity) {
  const start = minutesFromTimeLabel(activity.start)
  const end = minutesFromTimeLabel(activity.end)

  if (end > start) return end - start

  return 30
}

function dedupeActivities(activities: TimelineActivity[]) {
  const seen = new Set<string>()

  return activities.filter((activity) => {
    const key = `${activity.type}-${activity.title}-${activity.start}-${activity.end}`

    if (seen.has(key)) return false

    seen.add(key)
    return true
  })
}

function daysOverdue(value?: string | null, todayKey?: string) {
  const dateKey = dateKeyFromDateValue(value)
  if (!dateKey || !todayKey) return 0

  const date = new Date(`${dateKey}T00:00:00`)
  const today = new Date(`${todayKey}T00:00:00`)

  return Math.max(0, Math.round((today.getTime() - date.getTime()) / 86400000))
}

function ActivityIcon({ type }: { type: string }) {
  if (type === 'meeting' || type === 'medical' || type === 'virtual') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="white" strokeWidth="1.4" />
        <path d="M1.5 5.5h11M4.5 1v2M9.5 1v2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'task' || type === 'tasks') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <rect x="2" y="2" width="10" height="10" rx="2" stroke="white" strokeWidth="1.4" />
        <path d="M4.5 7l2 2 3.5-3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
      <circle cx="7" cy="7" r="4" stroke="white" strokeWidth="1.4" />
      <path d="M7 5v4M5 7h4" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function WidgetCard({
  id,
  label,
  count,
  color,
  activeWidget,
  setActiveWidget,
  children,
}: {
  id: WidgetId
  label: string
  count: number
  color: string
  activeWidget: WidgetId | null
  setActiveWidget: (value: WidgetId | null) => void
  children: ReactNode
}) {
  const open = activeWidget === id

  return (
    <div className="min-w-0 flex-1 overflow-hidden rounded-[10px] border border-[var(--border)] bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-[#faf9f8]"
        onClick={() => setActiveWidget(open ? null : id)}
      >
        <span className="text-[12px] font-medium" style={{ color }}>
          {label}
        </span>

        <span
          className="min-w-[22px] rounded-[7px] px-2 py-0.5 text-center text-[11px] font-semibold"
          style={{
            backgroundColor: `${color}22`,
            color,
          }}
        >
          {count}
        </span>
      </button>

      {open && <div className="border-t border-[var(--border)]">{children}</div>}

      <button
        type="button"
        className="flex w-full items-center justify-center border-t border-[var(--border)] py-1.5 transition hover:bg-[#faf9f8]"
        onClick={() => setActiveWidget(open ? null : id)}
        aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
      >
        <svg
          viewBox="0 0 14 14"
          className={`h-3.5 w-3.5 text-[#aaa] transition ${open ? 'rotate-180' : ''}`}
          fill="none"
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

function EmptyWidgetRow({ label }: { label: string }) {
  return <div className="px-3 py-3 text-[11px] text-[var(--muted)]">{label}</div>
}

function TaskWidgetRow({
  task,
  todayKey,
  contactName,
  onClick,
}: {
  task: Task
  todayKey: string
  contactName?: string | null
  onClick: () => void
}) {
  const overdue = isOverdueDate(task.due_date, todayKey)
  const dueToday = isTodayDate(task.due_date, todayKey)
  const typeLabel = taskTypeLabel(task.task_type)

  let dueChip = formatDueLabel(task.due_date)
  let chipClass = 'bg-[#f5f2ef] text-[var(--muted)]'

  if (overdue) {
    dueChip = `overdue · ${formatDueLabel(task.due_date)}`
    chipClass = 'bg-[rgba(201,136,142,0.13)] text-[#c9888e]'
  } else if (dueToday) {
    dueChip = 'due today'
    chipClass = 'bg-[rgba(193,152,173,0.14)] text-[#9f6e89]'
  } else if (!task.due_date) {
    dueChip = 'no due date'
  }

  return (
    <button
      type="button"
      className="block w-full border-b border-[rgba(44,44,42,0.06)] px-3 py-2 text-left last:border-b-0"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[11.5px] font-medium">{task.title}</p>
        {task.starred && <span className="shrink-0 text-[#f0c040]">★</span>}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusPillClass(task.status)}`}>
          {statusLabel(task.status)}
        </span>

        {contactName && (
          <span className="rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92]">
            {contactName}
          </span>
        )}

        {typeLabel && (
          <span className="rounded-full bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[#8a867f]">
            {typeLabel}
          </span>
        )}

        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${chipClass}`}>
          {dueChip}
        </span>

        <span className="rounded-full bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
          {task.estimated_minutes}m
        </span>
      </div>
    </button>
  )
}

function TimelineGap({
  minutes,
  afterMinutes,
  onAdd,
}: {
  minutes: number
  afterMinutes: number
  onAdd: (startTime: string) => void
}) {
  if (minutes < 15) return null

  const startTime = timeValueFromMinutes(afterMinutes)

  return (
    <div className="flex items-center py-5">
      <div className="w-[86px] shrink-0" />

      <div className="flex w-9 shrink-0 justify-center">
        <button
          type="button"
          onClick={() => onAdd(startTime)}
          className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-[#c0bbb5] bg-white text-[#a0968e] transition hover:border-[#8a8078] hover:bg-[#f8f6f3]"
          aria-label="Add activity"
        >
          <span className="text-sm leading-none">+</span>
        </button>
      </div>

      <div className="min-w-0 flex-1 px-4 text-[10.5px] text-[#b5b0a8]">
        <span className="font-medium text-[#9a9590]">{durationLabel(minutes)} free</span>
        <span> · until {timeLabelFromMinutes(afterMinutes + minutes)}</span>
      </div>
    </div>
  )
}

function TodayTimeline({
  activities,
  onDeleteManualActivity,
  onAddActivity,
}: {
  activities: TimelineDisplayItem[]
  onDeleteManualActivity: (id: string) => void
  onAddActivity: (startTime?: string) => void
}) {
  const dayStart = 8 * 60
  const dayEnd = 21 * 60

  const sorted = [...activities].sort(
    (a, b) => minutesFromTimeLabel(a.start) - minutesFromTimeLabel(b.start),
  )

  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-white py-4">
      {sorted.length === 0 ? (
        <div>
          <TimelineGap minutes={dayEnd - dayStart} afterMinutes={dayStart} onAdd={onAddActivity} />

          <div className="px-6 pb-4 text-center text-sm text-[var(--muted)]">
            Nothing scheduled yet. Add an activity to start shaping the day.
          </div>
        </div>
      ) : (
        <>
          {minutesFromTimeLabel(sorted[0].start) - dayStart >= 15 && (
            <TimelineGap
              minutes={minutesFromTimeLabel(sorted[0].start) - dayStart}
              afterMinutes={dayStart}
              onAdd={onAddActivity}
            />
          )}

          {sorted.map((activity, index) => {
            const color = activityColors[activity.type] ?? activityColors.custom
            const end = minutesFromTimeLabel(activity.end)
            const next = sorted[index + 1]
            const nextStart = next ? minutesFromTimeLabel(next.start) : null
            const gap = nextStart ? nextStart - end : 0
            const isLast = index === sorted.length - 1

            return (
              <div key={activity.id}>
                <div className="flex items-start">
                  <div className="w-[86px] shrink-0 pr-5 pt-2 text-right text-[11.5px] font-medium text-[var(--muted)]">
                    {activity.start}
                  </div>

                  <div className="flex w-9 shrink-0 flex-col items-center">
                    <div
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full"
                      style={{
                        backgroundColor: color,
                        outline: activity.isJamieAdded ? `3px solid ${color}22` : undefined,
                        outlineOffset: activity.isJamieAdded ? 1 : undefined,
                      }}
                    >
                      <ActivityIcon type={activity.type} />
                    </div>

                    {!isLast && (
                      <div
                        className="min-h-5 w-[2px] flex-1"
                        style={{ backgroundColor: `${color}28` }}
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 px-4 pb-5 pt-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium leading-snug text-[var(--text)]">
                          {activity.title}
                        </p>

                        <p className="mt-1 text-[11px] text-[var(--muted)]">
                          {durationLabel(activity.durationMinutes)}
                          {activity.isJamieAdded ? ' · from calendar' : ''}
                        </p>
                      </div>

                      {activity.isManual && (
                        <button
                          type="button"
                          onClick={() => onDeleteManualActivity(activity.id)}
                          className="text-[15px] leading-none text-[#ccc] transition hover:text-[#c9888e]"
                          aria-label="Delete activity"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {gap >= 15 && (
                  <TimelineGap minutes={gap} afterMinutes={end} onAdd={onAddActivity} />
                )}
              </div>
            )
          })}

          {dayEnd - minutesFromTimeLabel(sorted[sorted.length - 1].end) >= 15 && (
            <TimelineGap
              minutes={dayEnd - minutesFromTimeLabel(sorted[sorted.length - 1].end)}
              afterMinutes={minutesFromTimeLabel(sorted[sorted.length - 1].end)}
              onAdd={onAddActivity}
            />
          )}
        </>
      )}
    </div>
  )
}

export function TodayPage() {
  const navigate = useNavigate()
  const { enrichedCalendarEvents } = useGoogleCalendar()
  const { tasks } = useTasks()
  const { contacts } = useContacts()
  const [openAdd, setOpenAdd] = useState(false)
  const [activeWidget, setActiveWidget] = useState<WidgetId | null>(null)
  const [activityStartTime, setActivityStartTime] = useState('09:00')

  const [manualActivities, setManualActivities] = useLocalStorage<TimelineActivity[]>(
    'spoonflow_today_manual_activities',
    [],
  )

  const todayKey = useMemo(() => todayDateKey(), [])

  const contactById = useMemo(() => {
    const map = new Map<string, string>()

    contacts.forEach((contact) => {
      map.set(contact.id, contact.name)
    })

    return map
  }, [contacts])

  const openAddActivity = (startTime = '09:00') => {
    setActivityStartTime(startTime)
    setOpenAdd(true)
  }

  const meetingActivities = useMemo<TimelineActivity[]>(() => {
    const todaysEvents = enrichedCalendarEvents.filter(
      (event) => localDateKeyFromIso(event.startTime) === todayKey,
    )

    const mappedEvents: TimelineActivity[] = todaysEvents.map((event) => ({
      id: `meeting-${event.id}-${event.startTime}`,
      type: calendarTypeForEvent(event.calendarId),
      title: event.title,
      start: toTimeLabel(event.startTime),
      end: toTimeLabel(event.endTime),
      isJamieAdded: true,
    }))

    return dedupeActivities(mappedEvents)
  }, [enrichedCalendarEvents, todayKey])

  const activeTasks = useMemo(() => tasks.filter(isActiveTask), [tasks])

  const overdueTasks = useMemo(
    () => activeTasks.filter((task) => isOverdueDate(task.due_date, todayKey)),
    [activeTasks, todayKey],
  )

  const todayTasks = useMemo(
    () => activeTasks.filter((task) => isTodayDate(task.due_date, todayKey)),
    [activeTasks, todayKey],
  )

  const starredTasks = useMemo(
    () => activeTasks.filter((task) => task.starred),
    [activeTasks],
  )

  const otherActiveTasks = useMemo(
    () =>
      activeTasks.filter(
        (task) =>
          !isOverdueDate(task.due_date, todayKey) &&
          !isTodayDate(task.due_date, todayKey) &&
          !task.starred,
      ),
    [activeTasks, todayKey],
  )

  const orderedTaskWidgetItems = useMemo(() => {
    const combined = [...overdueTasks, ...todayTasks, ...starredTasks, ...otherActiveTasks]
    const seen = new Set<string>()

    return combined.filter((task) => {
      if (seen.has(task.id)) return false
      seen.add(task.id)
      return true
    })
  }, [overdueTasks, todayTasks, starredTasks, otherActiveTasks])

  const nurtureDueContacts = useMemo(
    () =>
      contacts
        .filter((contact) => {
          if (!contact.nurture_frequency_days) return false
          const nurtureKey = dateKeyFromDateValue(contact.next_nurture_date)
          if (!nurtureKey) return false

          return nurtureKey <= todayKey
        })
        .sort((a, b) =>
          (dateKeyFromDateValue(a.next_nurture_date) ?? '').localeCompare(
            dateKeyFromDateValue(b.next_nurture_date) ?? '',
          ),
        ),
    [contacts, todayKey],
  )

  const timelineActivities = useMemo<TimelineDisplayItem[]>(() => {
    const calendarItems: TimelineDisplayItem[] = meetingActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      start: activity.start,
      end: activity.end,
      durationMinutes: durationFromActivity(activity),
      isManual: false,
      isJamieAdded: activity.isJamieAdded,
    }))

    const manualItems: TimelineDisplayItem[] = manualActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      start: activity.start,
      end: activity.end,
      durationMinutes: durationFromActivity(activity),
      isManual: true,
      isJamieAdded: activity.isJamieAdded,
    }))

    return [...calendarItems, ...manualItems].sort(
      (a, b) => minutesFromTimeLabel(a.start) - minutesFromTimeLabel(b.start),
    )
  }, [meetingActivities, manualActivities])

  return (
    <section className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
        <div>
          <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">Today</h1>
          <p className="mt-1 text-[11px] text-[var(--muted)]">{todayLongLabel()}</p>
        </div>

        <button
          type="button"
          className="rounded-full bg-[var(--tasks)] px-4 py-2 text-[11.5px] font-medium text-white shadow-sm transition hover:opacity-90"
          onClick={() => openAddActivity('09:00')}
        >
          + New Timeline Activity
        </button>
      </header>

      <div className="space-y-3 p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <WidgetCard
            id="meetings"
            label="Meetings"
            count={meetingActivities.length}
            color="#6484a1"
            activeWidget={activeWidget}
            setActiveWidget={setActiveWidget}
          >
            {meetingActivities.length === 0 ? (
              <EmptyWidgetRow label="No meetings found for today." />
            ) : (
              meetingActivities.slice(0, 5).map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  className="block w-full border-b border-[rgba(44,44,42,0.06)] px-3 py-2 text-left last:border-b-0"
                >
                  <p className="text-[11.5px] font-medium">{meeting.title}</p>
                  <p className="mt-1 text-[10px] text-[var(--muted)]">
                    {meeting.start} · {durationLabel(durationFromActivity(meeting))}
                  </p>
                </button>
              ))
            )}
          </WidgetCard>

          <WidgetCard
            id="tasks"
            label="Tasks"
            count={activeTasks.length}
            color="#c198ad"
            activeWidget={activeWidget}
            setActiveWidget={setActiveWidget}
          >
            {orderedTaskWidgetItems.length === 0 ? (
              <EmptyWidgetRow label="No active tasks right now." />
            ) : (
              orderedTaskWidgetItems.slice(0, 8).map((task) => (
                <TaskWidgetRow
                  key={task.id}
                  task={task}
                  todayKey={todayKey}
                  contactName={task.contact_id ? contactById.get(task.contact_id) ?? null : null}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                />
              ))
            )}
          </WidgetCard>

          <WidgetCard
            id="nurture"
            label="Nurture"
            count={nurtureDueContacts.length}
            color="#8fa790"
            activeWidget={activeWidget}
            setActiveWidget={setActiveWidget}
          >
            {nurtureDueContacts.length === 0 ? (
              <EmptyWidgetRow label="No nurture follow-ups due." />
            ) : (
              nurtureDueContacts.slice(0, 6).map((contact) => {
                const overdueDays = daysOverdue(contact.next_nurture_date, todayKey)

                return (
                  <button
                    key={contact.id}
                    type="button"
                    className="block w-full border-b border-[rgba(44,44,42,0.06)] px-3 py-2 text-left last:border-b-0"
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    <p className="text-[11.5px] font-medium">{contact.name}</p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {(contact.company || contact.email) && (
                        <span className="rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92]">
                          {contact.company || contact.email}
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          overdueDays > 0
                            ? 'bg-[rgba(201,136,142,0.13)] text-[#c9888e]'
                            : 'bg-[rgba(143,167,144,0.18)] text-[#6f8d70]'
                        }`}
                      >
                        {overdueDays > 0
                          ? `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`
                          : 'Due today'}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </WidgetCard>

          <WidgetCard
            id="content"
            label="Content"
            count={timelineActivities.filter((item) => item.type === 'content').length}
            color="#e2b7be"
            activeWidget={activeWidget}
            setActiveWidget={setActiveWidget}
          >
            <EmptyWidgetRow label="Content due soon will show here once wired." />
          </WidgetCard>
        </div>

        <TodayTimeline
          activities={timelineActivities}
          onDeleteManualActivity={(id) =>
            setManualActivities((prev) => prev.filter((item) => item.id !== id))
          }
          onAddActivity={openAddActivity}
        />
      </div>

      <AddActivityModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        defaultStart={activityStartTime}
        onCreate={(activity) => setManualActivities((prev) => [...prev, activity])}
      />
    </section>
  )
}
