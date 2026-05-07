import { useState } from 'react'
import { Modal } from '../shared/Modal'

export function GoalModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (payload: { title: string; category?: string | null }) => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')

  return (
    <Modal open={open} onClose={onClose} title="New Goal">
      <div className="space-y-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Goal title"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 font-serif"
        />
        <input
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Category"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
        />
        <div className="flex justify-end gap-2">
          <button type="button" className="rounded-lg border border-[var(--border)] px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
            onClick={async () => {
              if (!title.trim()) return
              await onCreate({ title: title.trim(), category: category.trim() || null })
              setTitle('')
              setCategory('')
              onClose()
            }}
          >
            Create
          </button>
        </div>
      </div>
    </Modal>
  )
}
