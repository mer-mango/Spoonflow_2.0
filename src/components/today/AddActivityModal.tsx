import { useEffect, useState } from 'react'
import { Modal } from '../shared/Modal'
import type { ActivityType, TimelineActivity } from './TimelineBlock'

type ActivityOption = {
  type: ActivityType
  label: string
  defaultTitle: string
  color: string
  defaultMinutes: number
}

const activityOptions: ActivityOption[] = [
  {
    type: 'task',
    label: 'Tasks',
    defaultTitle: 'Task Block',
    color: '#c198ad',
    defaultMinutes: 90,
  },
  {
    type: 'content',
    label: 'Content',
    defaultTitle: 'Content Block',
    color: '#e2b7be',
    defaultMinutes: 60,
  },
  {
    type: 'nurture',
    label: 'Nurture',
    defaultTitle: 'Nurture Block',
    color: '#8fa790',
    defaultMinutes: 30,
  },
  {
    type: 'break',
    label: 'Break',
    defaultTitle: 'Break',
    color: '#c8c5c0',
    defaultMinutes: 15,
  },
  {
    type: 'email',
    label: 'Email',
    defaultTitle: 'Email',
    color: '#b8a7c9',
    defaultMinutes: 30,
  },
  {
    type: 'pt',
    label: 'PT',
    defaultTitle: 'PT / Movement',
    color: '#bcd1d5',
    defaultMinutes: 45,
  },
  {
    type: 'professional-dev',
    label: 'Professional Development',
    defaultTitle: 'Professional Development',
    color: '#9eafa4',
    defaultMinutes: 60,
  },
  {
    type: 'lunch',
    label: 'Lunch',
    defaultTitle: 'Lunch',
    color: '#d4b5a0',
    defaultMinutes: 30,
  },
  {
    type: 'wind-down',
    label: 'Wind Down',
    defaultTitle: 'Wind Down',
    color: '#93738e',
    defaultMinutes: 30,
  },
  {
    type: 'custom',
    label: 'Custom',
    defaultTitle: 'Custom Block',
    color: '#b0b5ba',
    defaultMinutes: 30,
  },
]

function minutesFromTime(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return hour * 60 + minute
}

function timeFromMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.min(totalMinutes, 23 * 60 + 59))
  const hour = Math.floor(safeMinutes / 60)
  const minute = safeMinutes % 60

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function optionForType(type: ActivityType) {
  return activityOptions.find((option) => option.type === type)
}

export function AddActivityModal({
  open,
  onClose,
  onCreate,
  defaultStart = '09:00',
}: {
  open: boolean
  onClose: () => void
  onCreate: (activity: TimelineActivity) => void
  defaultStart?: string
}) {
  const [start, setStart] = useState(defaultStart)
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([])
  const [durations, setDurations] = useState<Record<string, number>>({})
  const [customTitles, setCustomTitles] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open) return

    setStart(defaultStart)
    setSelectedTypes([])
    setDurations({})
    setCustomTitles({})
  }, [open, defaultStart])

  const toggleType = (type: ActivityType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((item) => item !== type)
      }

      return [...prev, type]
    })

    const option = optionForType(type)

    if (option) {
      setDurations((prev) => ({
        ...prev,
        [type]: prev[type] ?? option.defaultMinutes,
      }))

      setCustomTitles((prev) => ({
        ...prev,
        [type]: prev[type] ?? option.defaultTitle,
      }))
    }
  }

  const updateDuration = (type: ActivityType, value: string) => {
    const minutes = Number(value)

    setDurations((prev) => ({
      ...prev,
      [type]: Number.isNaN(minutes) ? 0 : minutes,
    }))
  }

  const updateTitle = (type: ActivityType, value: string) => {
    setCustomTitles((prev) => ({
      ...prev,
      [type]: value,
    }))
  }

  const handleCreate = () => {
    if (selectedTypes.length === 0) return

    let cursor = minutesFromTime(start)

    selectedTypes.forEach((type) => {
      const option = optionForType(type)
      if (!option) return

      const duration = Math.max(5, durations[type] ?? option.defaultMinutes)
      const activityStart = timeFromMinutes(cursor)
      const activityEnd = timeFromMinutes(cursor + duration)
      const title = customTitles[type]?.trim() || option.defaultTitle

      onCreate({
        id: crypto.randomUUID(),
        type,
        title,
        start: activityStart,
        end: activityEnd,
      })

      cursor += duration
    })

    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Activities">
      <div className="overflow-hidden rounded-2xl bg-white">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-[var(--muted)]">
              Select one or more activity blocks and set their durations.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--muted)]">
              Start time
            </label>

            <input
              type="time"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className="w-full rounded-full border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--jamie)]"
            />
          </div>

          <div className="max-h-[360px] space-y-2 overflow-y-auto border-y border-[var(--border)] py-3">
            {activityOptions.map((option) => {
              const selected = selectedTypes.includes(option.type)
              const orderNumber = selectedTypes.indexOf(option.type) + 1

              return (
                <div
                  key={option.type}
                  className={`rounded-xl px-2 py-2 transition ${
                    selected ? 'bg-[#faf9f8]' : 'hover:bg-[#faf9f8]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleType(option.type)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none ${
                        selected
                          ? 'border-[var(--jamie)] bg-[var(--jamie)] text-white'
                          : 'border-[#c8c5c0] bg-white text-transparent'
                      }`}
                      aria-label={selected ? `Remove ${option.label}` : `Add ${option.label}`}
                    >
                      ✓
                    </button>

                    {selected && (
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--jamie)] text-[9px] font-semibold text-white">
                        {orderNumber}
                      </span>
                    )}

                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />

                    <button
                      type="button"
                      onClick={() => toggleType(option.type)}
                      className="min-w-0 flex-1 text-left text-sm font-medium text-[var(--text)]"
                    >
                      {option.label}
                    </button>
                  </div>

                  {selected && (
                    <div className="ml-14 mt-2 grid gap-2 sm:grid-cols-[1fr_110px]">
                      <input
                        value={customTitles[option.type] ?? option.defaultTitle}
                        onChange={(event) => updateTitle(option.type, event.target.value)}
                        placeholder={option.defaultTitle}
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs outline-none focus:border-[var(--jamie)]"
                      />

                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={durations[option.type] ?? option.defaultMinutes}
                          onChange={(event) => updateDuration(option.type, event.target.value)}
                          className="w-[74px] rounded-full border border-[var(--border)] px-3 py-1.5 text-xs outline-none focus:border-[var(--jamie)]"
                        />

                        <span className="text-xs text-[var(--muted)]">min</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--muted)] transition hover:bg-black/[0.03]"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedTypes.length === 0}
              className="rounded-full bg-[var(--jamie)] px-5 py-2 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              onClick={handleCreate}
            >
              Add Activities
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
