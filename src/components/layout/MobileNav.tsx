import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

type Tab = {
  label: string
  path: string
  icon: 'today' | 'contacts' | 'tasks' | 'content' | 'more'
}

const tabs: Tab[] = [
  { label: 'Today', path: '/today', icon: 'today' },
  { label: 'Contacts', path: '/contacts', icon: 'contacts' },
  { label: 'Tasks', path: '/tasks', icon: 'tasks' },
  { label: 'Content', path: '/content', icon: 'content' },
  { label: 'More', path: '/settings', icon: 'more' },
]

const moreItems = [
  { label: 'Calendar', path: '/calendar' },
  { label: 'Nurture', path: '/nurture' },
  { label: 'Goals', path: '/goals' },
  { label: 'Settings', path: '/settings' },
]

function Icon({ name }: { name: Tab['icon'] }) {
  switch (name) {
    case 'today':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 10.5 12 3l9 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'contacts':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2.2" />
          <path d="M3.5 20c0-3.2 2.4-5 5.5-5s5.5 1.8 5.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M15 12.5c2 .1 3.5 1.7 3.5 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16" cy="8.5" r="2.2" stroke="currentColor" strokeWidth="2.2" />
        </svg>
      )
    case 'tasks':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m5 12 3 3 6-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 12h4M15 17h4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'content':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 4h12a1 1 0 0 1 1 1v14l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round" />
          <path d="M9 8h6M9 12h5" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      )
    case 'more':
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" fill="currentColor" />
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <circle cx="19" cy="12" r="1.8" fill="currentColor" />
        </svg>
      )
  }
}

export function MobileNav() {
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <>
      {moreOpen && (
        <button
          type="button"
          aria-label="Close more menu"
          className="fixed inset-0 z-40 bg-black/10 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-3 right-3 z-50 rounded-2xl border-[0.5px] border-[var(--border)] bg-white p-2 shadow-[0_8px_28px_rgba(0,0,0,0.14)] lg:hidden">
          {moreItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[13px] text-[var(--text)] hover:bg-[#f5f3f0]"
              onClick={() => {
                navigate(item.path)
                setMoreOpen(false)
              }}
            >
              {item.label}
              <span className="text-[var(--muted)]">›</span>
            </button>
          ))}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-[0.5px] border-[var(--border)] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid h-16 grid-cols-5">
          {tabs.map((tab) => {
            if (tab.label === 'More') {
              return (
                <button
                  key={tab.path}
                  type="button"
                  className={`flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${moreOpen ? 'text-[var(--jamie)]' : 'text-[var(--muted)]'}`}
                  onClick={() => setMoreOpen((value) => !value)}
                >
                  <span className="h-[20px] w-[20px]"><Icon name={tab.icon} /></span>
                  <span>{tab.label}</span>
                </button>
              )
            }

            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${isActive ? 'text-[var(--jamie)]' : 'text-[var(--muted)]'}`
                }
              >
                <span className="h-[20px] w-[20px]"><Icon name={tab.icon} /></span>
                <span>{tab.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
