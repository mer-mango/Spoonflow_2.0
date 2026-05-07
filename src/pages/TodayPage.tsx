import { useMemo, useState } from 'react'
import { AddActivityModal } from '../components/today/AddActivityModal'
import { SubwayTimeline } from '../components/today/SubwayTimeline'
import { WidgetStrip } from '../components/today/WidgetStrip'
import type { TimelineActivity } from '../components/today/TimelineBlock'
import { useGoogleCalendar } from '../hooks/useGoogleCalendar'
import { useLocalStorage } from '../hooks/useLocalStorage'

function toTimeLabel(iso: string) {
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function TodayPage() {
  const { enrichedCalendarEvents } = useGoogleCalendar()
  const [openAdd, setOpenAdd] = useState(false)
  const [manualActivities, setManualActivities] = useLocalStorage<TimelineActivity[]>(
    'spoonflow_today_manual_activities',
    [],
  )

  const meetingActivities = useMemo<TimelineActivity[]>(
    () =>
      enrichedCalendarEvents.map((event) => ({
        id: `meeting-${event.id}`,
        type:
          event.calendarId === 'MEDICAL_APPTS_CALENDAR_ID'
            ? 'medical'
            : event.calendarId === 'VIRTUAL_APPTS_CALENDAR_ID'
              ? 'virtual'
              : 'meeting',
        title: event.title,
        start: toTimeLabel(event.startTime),
        end: toTimeLabel(event.endTime),
        isJamieAdded: true,
      })),
    [enrichedCalendarEvents],
  )

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
        <h1 className="text-2xl">Today</h1>
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
        <SubwayTimeline
          activities={activities}
          onDelete={(id) => setManualActivities((prev) => prev.filter((item) => item.id !== id))}
        />
      </div>

      <AddActivityModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onCreate={(activity) => setManualActivities((prev) => [...prev, activity])}
      />
    </section>
  )
}
