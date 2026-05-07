import { useState } from 'react'
import { Modal } from '../shared/Modal'
import type { ActivityType, TimelineActivity } from './TimelineBlock'

const activityTypes: ActivityType[] = [
  'task',
  'content',
  'nurture',
  'break',
  'email',
  'pt',
  'professional-dev',
  'lunch',
  'wind-down',
  'custom',
]

export function AddActivityModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (activity: TimelineActivity) => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ActivityType>('task')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('09:30')

  return (
    <Modal open={open} onClose={onClose} title="Add Activity">
      <div className="grid gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Activity title"
          className="rounded-lg border border-[var(--border)] px-3 py-2"
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ActivityType)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          >
            {activityTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            type="time"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
          <input
            type="time"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
            onClick={() => {
              if (!title.trim()) return
              onCreate({
                id: crypto.randomUUID(),
                type,
                title: title.trim(),
                start,
                end,
              })
              setTitle('')
              onClose()
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  )
}
