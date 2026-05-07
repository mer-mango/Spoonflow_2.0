import { TimelineBlock, type TimelineActivity } from './TimelineBlock'

export function SubwayTimeline({
  activities,
  onDelete,
}: {
  activities: TimelineActivity[]
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-2">
      {activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--muted)]">
          No activities yet. Add your first block.
        </div>
      ) : (
        activities.map((activity) => (
          <TimelineBlock key={activity.id} activity={activity} onDelete={onDelete} />
        ))
      )}
    </div>
  )
}
