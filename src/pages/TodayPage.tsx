import { PlanMyDayWizard } from '../components/today/PlanMyDayWizard'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { TaskModal } from '../components/shared/TaskModal'
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
  goals: '#a389aa',
  custom: '#b0b5ba',
}

const timelineActivityOptions: Array<{
  type: TimelineActivity['type']
  title: string
}> = [
  { type: 'task', title: 'Task' },
  { type: 'content', title: 'Content' },
  { type: 'nurture', title: 'Nurture' },
  { type: 'email', title: 'Email' },
  { type: 'break', title: 'Break' },
  { type: 'pt', title: 'PT' },
  { type: 'professional-dev', title: 'Professional Development' },
  { type: 'lunch', title: 'Lunch' },
  { type: 'wind-down', title: 'Wind Down' },
  { type: 'goals', title: 'Goals' },
  { type: 'custom', title: 'Custom' },
]

function timelineActivityOptionForType(type: TimelineActivity['type']) {
  return timelineActivityOptions.find((option) => option.type === type)
}

const timelineTimeTextClass =
  'w-[76px] border-0 bg-transparent p-0 text-right text-[11.5px] font-medium text-[var(--muted)] outline-none transition hover:text-[var(--text)] focus:text-[var(--text)]'

const timelineDurationSelectClass =
  'appearance-none border-0 bg-transparent p-0 pr-0 text-[11px] font-normal text-[var(--muted)] outline-none transition hover:text-[var(--text)] focus:text-[var(--text)]'
function shortNurtureDateLabel(value?: string | null) {
  const dateKey = dateKeyFromDateValue(value)

  if (!dateKey) return 'No date'

  return new Date(`${dateKey}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function nurtureFrequencyLabel(days?: number | null) {
  if (!days) return '—'

  const weeks = Math.round(days / 7)

  if (weeks >= 1 && days % 7 === 0) {
    return `${weeks} wks`
  }

  return `${days}d`
}

function isNurtureOverdue(value: string | null | undefined, todayKey: string) {
  const dateKey = dateKeyFromDateValue(value)

  if (!dateKey) return false

  return dateKey < todayKey
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

function statusPillClass(status: Task['status']) {
  if (status === 'toDo') return 'bg-[rgba(193,152,173,0.16)] text-[#9f6e89]'
  if (status === 'inProgress') return 'bg-[rgba(212,167,122,0.18)] text-[#b57943]'
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
  if (!trimmed) return Number.NaN

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1])
    const minute = Number(twentyFourHourMatch[2])

    if (hour > 23 || minute > 59) return Number.NaN
    return hour * 60 + minute
  }

  const twelveHourMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i)
  if (twelveHourMatch) {
    let hour = Number(twelveHourMatch[1])
    const minute = Number(twelveHourMatch[2] ?? 0)
    const meridiem = twelveHourMatch[3].toLowerCase()

    if (hour < 1 || hour > 12 || minute > 59) return Number.NaN
    if (meridiem === 'pm' && hour !== 12) hour += 12
    if (meridiem === 'am' && hour === 12) hour = 0

    return hour * 60 + minute
  }

  return Number.NaN
}

function timeValueFromMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59))
  const hour = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function timeLabelFromMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59))
  const hour24 = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60
  const meridiem = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12

  return `${hour12}:${String(minute).padStart(2, '0')} ${meridiem}`
}

function displayTimeLabel(label: string) {
  const minutes = minutesFromTimeLabel(label)

  if (!Number.isFinite(minutes)) return label

  return timeLabelFromMinutes(minutes)
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

  if (Number.isFinite(start) && Number.isFinite(end) && end > start) return end - start

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

  if (type === 'nurture') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <path d="M7 12V7.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7 7.5C5.2 7.2 3.8 6 3.4 4.2C5.2 4 6.6 4.8 7 7.5Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 7.5C8.8 7.1 10.2 5.9 10.6 4.1C8.8 3.9 7.4 4.8 7 7.5Z" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'content') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <path
          d="M8.8 2.3L11.7 5.2L5.3 11.6L2.4 12.2L3 9.3L8.8 2.3Z"
          stroke="white"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.9 3.4L10.6 6.1"
          stroke="white"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (type === 'goals') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <circle cx="7" cy="7" r="4.8" stroke="white" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="2.5" stroke="white" strokeWidth="1.3" />
        <circle cx="7" cy="7" r="0.7" fill="white" />
      </svg>
    )
  }

  if (type === 'professional-dev' || type === 'prodev') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <path d="M2.5 2.5h3.2C6.4 2.5 7 3.1 7 3.8v7.7c0-.8-.6-1.4-1.3-1.4H2.5V2.5Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M11.5 2.5H8.3C7.6 2.5 7 3.1 7 3.8v7.7c0-.8.6-1.4 1.3-1.4h3.2V2.5Z" stroke="white" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'break' || type === 'brk') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <path d="M5 3v8M9 3v8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (type === 'email') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <rect x="1.8" y="3" width="10.4" height="8" rx="1.4" stroke="white" strokeWidth="1.4" />
        <path d="M2.2 4.2L7 7.5l4.8-3.3" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'pt') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <circle cx="4" cy="10" r="2" stroke="white" strokeWidth="1.3" />
        <circle cx="10" cy="10" r="2" stroke="white" strokeWidth="1.3" />
        <path d="M5.2 10L7 6.5l1.7 3.5M7 6.5h2M6 4.3h2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'lunch') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <path d="M4 2v10M2.8 2v3.2C2.8 6.1 3.3 6.8 4 6.8s1.2-.7 1.2-1.6V2" stroke="white" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M9.5 2.2c1.1.5 1.8 1.7 1.8 3.2v6.6M9.5 2.2v4.6h1.8" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (type === 'wind-down' || type === 'winddown') {
    return (
      <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
        <path d="M10.8 9.6A5 5 0 0 1 4.4 3.2A5 5 0 1 0 10.8 9.6Z" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
      <circle cx="7" cy="7" r="2.2" fill="white" />
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
  onQuickUpdate,
}: {
  task: Task
  todayKey: string
  contactName?: string | null
  onClick: () => void
  onQuickUpdate: (task: Task, patch: Partial<Task>) => Promise<void> | void
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
    <article className="block w-full border-b border-[rgba(44,44,42,0.06)] px-3 py-2 text-left last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          className="min-w-0 flex-1 truncate text-left text-[11.5px] font-medium text-[var(--text)] transition hover:text-[var(--tasks)]"
          onClick={onClick}
        >
          {task.title}
        </button>

        {task.starred && <span className="shrink-0 text-[#f0c040]">★</span>}
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <select
          value={task.status}
          onChange={(event) =>
            void onQuickUpdate(task, {
              status: event.target.value as Task['status'],
            })
          }
          onClick={(event) => event.stopPropagation()}
          className={`h-[22px] rounded-full border-0 px-2 py-0.5 text-[10px] font-medium outline-none ${statusPillClass(
            task.status,
          )}`}
          title="Edit status"
        >
          <option value="toDo">To Do</option>
          <option value="inProgress">In Progress</option>
          <option value="awaitingReply">Awaiting Reply</option>
          <option value="done">Done</option>
        </select>

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

        <input
          type="date"
          value={task.due_date ?? ''}
          onChange={(event) =>
            void onQuickUpdate(task, {
              due_date: event.target.value || null,
            })
          }
          onClick={(event) => event.stopPropagation()}
          className={`h-[22px] max-w-[112px] rounded-full border-0 px-2 py-0.5 text-[10px] font-medium outline-none ${chipClass}`}
          title={dueChip}
        />

        <select
          value={String(task.estimated_minutes ?? 30)}
          onChange={(event) =>
            void onQuickUpdate(task, {
              estimated_minutes: Number(event.target.value),
            })
          }
          onClick={(event) => event.stopPropagation()}
          className="h-[22px] rounded-full border-0 bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)] outline-none"
          title="Edit estimated time"
        >
          <option value="5">5m</option>
          <option value="10">10m</option>
          <option value="15">15m</option>
          <option value="20">20m</option>
          <option value="30">30m</option>
          <option value="45">45m</option>
          <option value="60">1h</option>
          <option value="90">1.5h</option>
          <option value="120">2h</option>
        </select>
      </div>
    </article>
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

function TimelineStartTimeInput({
  activity,
  hasOverlap,
  isCurrent,
  onUpdateStart,
}: {
  activity: TimelineDisplayItem
  hasOverlap: boolean
  isCurrent: boolean
  onUpdateStart: (activity: TimelineDisplayItem, nextStart: string) => void
}) {
  const [value, setValue] = useState(displayTimeLabel(activity.start))

  useEffect(() => {
    setValue(displayTimeLabel(activity.start))
  }, [activity.start])

  const commit = () => {
    const minutes = minutesFromTimeLabel(value)

    if (!Number.isFinite(minutes)) {
      setValue(displayTimeLabel(activity.start))
      return
    }

    onUpdateStart(activity, timeLabelFromMinutes(minutes))
  }

  if (!activity.isManual) {
    return (
      <div
        className={`w-[86px] shrink-0 pr-5 pt-2 text-right text-[11.5px] ${
          hasOverlap
            ? 'font-semibold text-[#c9888e]'
            : isCurrent
              ? 'font-semibold text-[var(--text)]'
              : 'font-medium text-[var(--muted)]'
        }`}
        title={hasOverlap ? 'This activity overlaps with the previous activity.' : undefined}
      >
        {displayTimeLabel(activity.start)}
      </div>
    )
  }

  return (
    <div className="w-[86px] shrink-0 pr-5 pt-2 text-right">
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.currentTarget.blur()
          }

          if (event.key === 'Escape') {
            setValue(displayTimeLabel(activity.start))
            event.currentTarget.blur()
          }
        }}
        className={`${timelineTimeTextClass} ${
          hasOverlap
            ? 'font-semibold text-[#c9888e] focus:text-[#c9888e]'
            : isCurrent
              ? 'font-semibold text-[var(--text)] focus:text-[var(--text)]'
              : ''
        }`}
        title={hasOverlap ? 'This activity overlaps with the previous activity.' : 'Edit start time'}
        aria-label="Edit start time"
      />
    </div>
  )
}

function TodayTimeline({
  activities,
  nowMinutes,
  onDeleteManualActivity,
  onUpdateManualActivity,
  onAddActivity,
}: {
  activities: TimelineDisplayItem[]
  nowMinutes: number
  onDeleteManualActivity: (id: string) => void
  onUpdateManualActivity: (id: string, patch: Partial<TimelineActivity>) => void
  onAddActivity: (startTime?: string) => void
}) {
  const dayStart = 8 * 60
  const dayEnd = 21 * 60

  const sorted = [...activities].sort(
    (a, b) => minutesFromTimeLabel(a.start) - minutesFromTimeLabel(b.start),
  )

  const updateManualStart = (activity: TimelineDisplayItem, nextStart: string) => {
    const nextStartMinutes = minutesFromTimeLabel(nextStart)
    if (!Number.isFinite(nextStartMinutes)) return

    const nextEnd = timeLabelFromMinutes(nextStartMinutes + activity.durationMinutes)

    onUpdateManualActivity(activity.id, {
      start: timeLabelFromMinutes(nextStartMinutes),
      end: nextEnd,
    })
  }

  const updateManualDuration = (activity: TimelineDisplayItem, nextDuration: number) => {
    const startMinutes = minutesFromTimeLabel(activity.start)
    if (!Number.isFinite(startMinutes)) return

    const nextEnd = timeLabelFromMinutes(startMinutes + nextDuration)

    onUpdateManualActivity(activity.id, {
      end: nextEnd,
    })
  }

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
            const start = minutesFromTimeLabel(activity.start)
            const end = minutesFromTimeLabel(activity.end)
            const previous = sorted[index - 1]
            const previousEnd = previous ? minutesFromTimeLabel(previous.end) : null
            const next = sorted[index + 1]
            const nextStart = next ? minutesFromTimeLabel(next.start) : null
            const gap =
              nextStart !== null && Number.isFinite(nextStart) && Number.isFinite(end)
                ? nextStart - end
                : 0
            const isLast = index === sorted.length - 1
            const hasOverlap =
              previousEnd !== null &&
              Number.isFinite(previousEnd) &&
              Number.isFinite(start) &&
              start < previousEnd
            const isCurrent =
              Number.isFinite(start) &&
              Number.isFinite(end) &&
              nowMinutes >= start &&
              nowMinutes < end

            return (
              <div key={activity.id}>
                <div className="flex items-start">
            <TimelineStartTimeInput
                activity={activity}
                hasOverlap={hasOverlap}
                isCurrent={isCurrent}
                onUpdateStart={updateManualStart}
            />

                  <div className="flex w-9 shrink-0 flex-col items-center">
                    <div
                      className="flex h-[34px] w-[34px] items-center justify-center rounded-full"
                    style={{
                      backgroundColor: color,
                      outline: isCurrent
                        ? `4px solid ${color}33`
                        : activity.isJamieAdded
                          ? `3px solid ${color}22`
                          : undefined,
                      outlineOffset: isCurrent ? 2 : activity.isJamieAdded ? 1 : undefined,
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
                      <div className="min-w-0 flex-1">
                        {activity.isManual ? (
                          <select
                            value={activity.type}
                            onChange={(event) => {
                              const nextType = event.target.value as TimelineActivity['type']
                              const nextOption = timelineActivityOptionForType(nextType)

                              onUpdateManualActivity(activity.id, {
                                type: nextType,
                                title: nextOption?.title ?? activity.title,
                              })
                            }}
                            className="w-full appearance-none truncate border-0 bg-transparent px-0 py-0 text-[13px] font-medium leading-snug text-[var(--text)] outline-none transition hover:text-[var(--tasks)] focus:text-[var(--tasks)]"
                            aria-label="Edit activity type"
                            title="Edit activity type"
                          >
                            {timelineActivityOptions.map((option) => (
                              <option key={option.type} value={option.type}>
                                {option.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="truncate text-[13px] font-medium leading-snug text-[var(--text)]">
                            {activity.title}
                          </p>
                        )}

                        {hasOverlap && (
                          <p className="mt-1 text-[11px] font-medium text-[#c9888e]">
                            Overlaps previous activity — adjust start time or duration.
                          </p>
                        )}

                        {activity.isManual ? (
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <select
                              value={String(activity.durationMinutes)}
                              onChange={(event) =>
                                updateManualDuration(activity, Number(event.target.value))
                              }
                              className={timelineDurationSelectClass}
                              title="Edit duration"
                              aria-label="Edit duration"
                            >
                              <option value="5">5m</option>
                              <option value="10">10m</option>
                              <option value="15">15m</option>
                              <option value="20">20m</option>
                              <option value="30">30m</option>
                              <option value="45">45m</option>
                              <option value="60">1h</option>
                              <option value="90">1.5h</option>
                              <option value="120">2h</option>
                            </select>

                            <span className="text-[11px] text-[var(--muted)]">
                              ends {displayTimeLabel(activity.end)}
                            </span>
                          </div>
                        ) : (
                          <p className="mt-1 text-[11px] text-[var(--muted)]">
                            {durationLabel(activity.durationMinutes)} · ends {displayTimeLabel(activity.end)}
                            {activity.isJamieAdded ? ' · from calendar' : ''}
                          </p>
                        )}
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
  const { tasks, updateTask, archiveTask } = useTasks()
  const { contacts } = useContacts()

  const [openAdd, setOpenAdd] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [activeWidget, setActiveWidget] = useState<WidgetId | null>(null)
  const [activityStartTime, setActivityStartTime] = useState('09:00')
  const [openPlanMyDay, setOpenPlanMyDay] = useState(false)

  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  })

  const [manualActivities, setManualActivities] = useLocalStorage<TimelineActivity[]>(
    'spoonflow_today_manual_activities',
    [],
  )
  
  useEffect(() => {
    const openWizard = () => setOpenPlanMyDay(true)

    window.addEventListener('spoonflow:open-plan-my-day', openWizard)

    return () => {
      window.removeEventListener('spoonflow:open-plan-my-day', openWizard)
    }
  }, [])

useEffect(() => {
  const updateNow = () => {
    const now = new Date()
    setNowMinutes(now.getHours() * 60 + now.getMinutes())
  }

  updateNow()

  const interval = window.setInterval(updateNow, 30000)

  window.addEventListener('focus', updateNow)
  document.addEventListener('visibilitychange', updateNow)

  return () => {
    window.clearInterval(interval)
    window.removeEventListener('focus', updateNow)
    document.removeEventListener('visibilitychange', updateNow)
  }
}, [])
  
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

  const updateManualActivity = (id: string, patch: Partial<TimelineActivity>) => {
    setManualActivities((prev) =>
      prev.map((activity) =>
        activity.id === id
          ? {
              ...activity,
              ...patch,
            }
          : activity,
      ),
    )
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
      start: displayTimeLabel(activity.start),
      end: displayTimeLabel(activity.end),
      durationMinutes: durationFromActivity(activity),
      isManual: false,
      isJamieAdded: activity.isJamieAdded,
    }))

    const manualItems: TimelineDisplayItem[] = manualActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      start: displayTimeLabel(activity.start),
      end: displayTimeLabel(activity.end),
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
              <EmptyWidgetRow label="No meetings today." />
            ) : (
              meetingActivities.slice(0, 6).map((meeting) => (
                <button
                  key={meeting.id}
                  type="button"
                  className="block w-full border-b border-[rgba(44,44,42,0.06)] px-3 py-2 text-left transition hover:bg-[#f8fbfd] last:border-b-0"
                >
                  <p className="truncate text-[11.5px] font-semibold text-[var(--meeting)]">
                    {meeting.title}
                  </p>
          
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded bg-[#f5f3f0] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                      {displayTimeLabel(meeting.start)}
                    </span>
          
                    <span className="rounded bg-[rgba(100,132,161,0.14)] px-1.5 py-0.5 text-[10px] font-medium text-[#6484a1]">
                      {displayTimeLabel(meeting.end)}
                    </span>
                  </div>
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
                  onClick={() => setSelectedTask(task)}
                  onQuickUpdate={async (item, patch) => {
                    await updateTask(item.id, patch)
                  }}
                />
              ))
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
                      const overdue = isNurtureOverdue(contact.next_nurture_date, todayKey)
                
                      return (
                        <button
                          key={contact.id}
                          type="button"
                          className="block w-full border-b border-[rgba(44,44,42,0.06)] px-3 py-2 text-left transition hover:bg-[#f8fdf8] last:border-b-0"
                          onClick={() => navigate(`/contacts/${contact.id}?tab=nurture`)}
                        >
                          <p className="truncate text-[11.5px] font-semibold text-[var(--meeting)]">
                            {contact.name}
                          </p>
                
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <span className="rounded bg-[#f5f3f0] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)]">
                              {nurtureFrequencyLabel(contact.nurture_frequency_days)}
                            </span>
                
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                overdue
                                  ? 'bg-[#fdf0f0] text-[var(--medical)]'
                                  : 'bg-[#f0f6f0] text-[#5a7a60]'
                              }`}
                            >
                              {shortNurtureDateLabel(contact.next_nurture_date)}
                            </span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </WidgetCard>

        <TodayTimeline
          activities={timelineActivities}
          nowMinutes={nowMinutes}
          onDeleteManualActivity={(id) =>
            setManualActivities((prev) => prev.filter((item) => item.id !== id))
          }
          onUpdateManualActivity={updateManualActivity}
          onAddActivity={openAddActivity}
        />
      </div>

      <PlanMyDayWizard
          open={openPlanMyDay}
          onClose={() => setOpenPlanMyDay(false)}
          todayLabel={todayLongLabel()}
          todayKey={todayKey}
          meetings={enrichedCalendarEvents.filter(
            (event) => localDateKeyFromIso(event.startTime) === todayKey,
          )}
          tasks={tasks}
          nurtureContacts={nurtureDueContacts}
          contactById={contactById}
          onOpenTask={(task) => setSelectedTask(task)}
          onUpdateTask={async (task, patch) => {
            await updateTask(task.id, patch)
          }}
          onArchiveTask={async (task) => {
            await archiveTask(task.id)
          }}
          onOpenNurture={(contactId) => navigate(`/contacts/${contactId}?tab=nurture`)}
        />
      
      <AddActivityModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        defaultStart={activityStartTime}
        onCreate={(activity) => setManualActivities((prev) => [...prev, activity])}
      />

      <TaskModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={async (id, patch) => {
          if (!id) return

          await updateTask(id, patch)
        }}
      />
    </section>
  )
}
