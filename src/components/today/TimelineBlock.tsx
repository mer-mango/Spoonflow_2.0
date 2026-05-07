export type ActivityType =
  | 'task'
  | 'content'
  | 'nurture'
  | 'break'
  | 'email'
  | 'pt'
  | 'professional-dev'
  | 'lunch'
  | 'wind-down'
  | 'custom'
  | 'meeting'
  | 'medical'
  | 'virtual'

export type TimelineActivity = {
  id: string
  type: ActivityType
  title: string
  start: string
  end: string
  isJamieAdded?: boolean
  customLabel?: string
}

const typeColor: Record<ActivityType, string> = {
  task: 'var(--tasks)',
  content: 'var(--content)',
  nurture: 'var(--nurture)',
  break: 'var(--await)',
  email: 'var(--contacts-2)',
  pt: 'var(--pt)',
  'professional-dev': 'var(--goals)',
  lunch: 'var(--contacts-3)',
  'wind-down': 'var(--goals)',
  custom: 'var(--muted)',
  meeting: 'var(--meeting)',
  medical: 'var(--medical)',
  virtual: 'var(--virtual)',
}

export function TimelineBlock({
  activity,
  onDelete,
}: {
  activity: TimelineActivity
  onDelete: (id: string) => void
}) {
  return (
    <article className="relative rounded-xl border border-[var(--border)] bg-white p-3">
      <span
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: typeColor[activity.type] }}
      />
      <div className="ml-2 flex items-start justify-between gap-2">
        <div>
          <p className="font-medium">{activity.customLabel || activity.title}</p>
          <p className="text-xs text-[var(--muted)]">
            {activity.start} - {activity.end} · {activity.type}
          </p>
        </div>
        {!activity.isJamieAdded && (
          <button
            type="button"
            className="text-xs text-[var(--muted)]"
            onClick={() => onDelete(activity.id)}
          >
            Remove
          </button>
        )}
      </div>
    </article>
  )
}
