import { NavLink } from 'react-router-dom'

type NavItem = { label: string; path: string; color: string; count?: number }

const items: NavItem[] = [
  { label: 'Today', path: '/today', color: '#666' },
  { label: 'Contacts', path: '/contacts', color: '#6d8c90' },
  { label: 'Calendar', path: '/calendar', color: '#6484a1' },
  { label: 'Tasks', path: '/tasks', color: '#c198ad', count: 0 },
  { label: 'Content', path: '/content', color: '#e2b7be', count: 0 },
  { label: 'Nurture', path: '/nurture', color: '#8fa790', count: 0 },
  { label: 'Goals', path: '/goals', color: '#93738e', count: 0 },
]

function DotIcon({ color }: { color: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[150px] shrink-0 border-r border-[var(--border)] bg-white lg:flex lg:flex-col">
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center rounded-lg px-2 py-2 text-sm ${
                isActive ? 'bg-[var(--text)] text-white' : 'text-[var(--text)] hover:bg-black/5'
              }`
            }
          >
            <DotIcon color={item.color} />
            <span className="ml-2">{item.label}</span>
            {typeof item.count === 'number' && <span className="ml-auto text-xs">{item.count}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-2 border-t border-[var(--border)] p-3 text-sm text-[var(--muted)]">
        <button className="flex w-full items-center justify-between"><span>Notifications</span><span className="text-[var(--medical)]">0</span></button>
        <button className="flex w-full items-center">Sync Calendar</button>
        <button className="flex w-full items-center">Settings</button>
      </div>
    </aside>
  )
}
