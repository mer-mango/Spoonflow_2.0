import { useMemo, useState } from 'react'
import { AddActivityModal } from '../components/today/AddActivityModal'
import { SubwayTimeline } from '../components/today/SubwayTimeline'
import { WidgetStrip } from '../components/today/WidgetStrip'
import type { TimelineActivity } from '../components/today/TimelineBlock'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { useLocalStorage } from '../hooks/useLocalStorage'

const MEDICAL_CALENDAR_ID = import.meta.env.VITE_GOOGLE_MEDICAL_CALENDAR_ID
const VIRTUAL_CALENDAR_ID = import.meta.env.VITE_GOOGLE_VIRTUAL_CALENDAR_ID

function toTimeLabel(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function localDateKeyFromIso(iso: string) {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function todayDateKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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

function dedupeActivities(activities: TimelineActivity[]) {
  const seen = new Set<string>()

  return activities.filter((activity) => {
    const key = `${activity.type}-${activity.title}-${activity.start}-${activity.end}`

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function TodayPage() {
  const { enrichedCalendarEvents } = useGoogleCalendar()
  const [openAdd, setOpenAdd] = useState(false)

  const [manualActivities, setManualActivities] = useLocalStorage<TimelineActivity[]>(
    'spoonflow_today_manual_activities',
    [],
  )

  const todayKey = useMemo(() => todayDateKey(), [])

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

  const activities = useMemo(
    () =>
      [...meetingActivities, ...manualActivities].sort((a, b) =>
        a.start.localeCompare(b.start),
      ),
    [meetingActivities, manualActivities],
  )

  return (
    <section className="mx-auto max-w-4xl space-y-4">
      <header className="flex items-center justify-between rounded-2xl bg-white p-4">
        <div>
          <h1 className="text-2xl">Today</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Your meetings, tasks, nurture reminders, and content work for today.
          </p>
        </div>

        <button
          type="button"
          className="rounded-full bg-[var(--jamie)] px-4 py-2 text-sm text-white"
          onClick={() => setOpenAdd(true)}
        >
          + Add Activity
        </button>
      </header>

      <WidgetStrip
        meetings={meetingActivities.length}
        tasks={activities.filter((item) => item.type === 'task').length}
        nurture={activities.filter((item) => item.type === 'nurture').length}
        content={activities.filter((item) => item.type === 'content').length}
      />

      <div className="rounded-2xl bg-white p-4">
        {activities.length > 0 ? (
          <SubwayTimeline
            activities={activities}
            onDelete={(id) =>
              setManualActivities((prev) => prev.filter((item) => item.id !== id))
            }
          />
        ) : (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-6 text-center">
            <p className="font-serif text-xl text-[var(--text)]">Nothing scheduled yet</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Add an activity or check your calendar connection if something looks missing.
            </p>
          </div>
        )}
      </div>

      <AddActivityModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreate={(activity) => setManualActivities((prev) => [...prev, activity])}
      />
    </section>
  )
}
