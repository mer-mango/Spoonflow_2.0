import { useState } from 'react'

const jamieItems = ['Plan My Day', 'Pre-Meeting Prep', 'Post-Meeting Debrief', 'PM Wind Down', 'Content Capture', 'Open Chat']
const createItems = ['New Contact', 'New Task', 'New Content Idea', 'New Goal']

export function TopBar() {
  const [jamieOpen, setJamieOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <header className="mb-4 flex items-center justify-end gap-3">
      <div className="relative">
        <button
          type="button"
          onClick={() => setJamieOpen((v) => !v)}
          className="rounded-full bg-[var(--jamie)] px-4 py-2 text-sm font-medium text-white"
        >
          Ask Jamie
        </button>
        {jamieOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-white p-1 shadow-lg">
            {jamieItems.map((item) => (
              <button key={item} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5">
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setCreateOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--jamie)] text-xl text-white"
        >
          +
        </button>
        {createOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-white p-1 shadow-lg">
            {createItems.map((item) => (
              <button key={item} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5">
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
