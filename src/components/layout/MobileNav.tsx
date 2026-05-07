import { NavLink } from 'react-router-dom'

const tabs = [
  { label: 'Today', path: '/today' },
  { label: 'Contacts', path: '/contacts' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Content', path: '/content' },
  { label: 'More', path: '/settings' },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid h-16 grid-cols-5">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center text-xs ${isActive ? 'text-[var(--jamie)]' : 'text-[var(--muted)]'}`
            }
          >
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
