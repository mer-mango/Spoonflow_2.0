type WidgetStripProps = {
  meetings: number
  tasks: number
  nurture: number
  content: number
}

export function WidgetStrip({ meetings, tasks, nurture, content }: WidgetStripProps) {
  const items = [
    { label: 'Meetings', value: meetings, color: 'var(--meeting)' },
    { label: 'Tasks', value: tasks, color: 'var(--tasks)' },
    { label: 'Nurture', value: nurture, color: 'var(--nurture)' },
    { label: 'Content', value: content, color: 'var(--content)' },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-[140px] rounded-xl bg-white p-3"
          style={{ borderTop: `4px solid ${item.color}` }}
        >
          <p className="text-xs text-[var(--muted)]">{item.label}</p>
          <p className="font-serif text-xl">{item.value}</p>
        </div>
      ))}
    </div>
  )
}
