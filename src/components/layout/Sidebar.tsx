import { NavLink } from 'react-router-dom'

type IconName =
  | 'today'
  | 'contacts'
  | 'calendar'
  | 'tasks'
  | 'content'
  | 'nurture'
  | 'goals'
  | 'bell'
  | 'sync'
  | 'settings'

type NavItem = {
  label: string
  path: string
  color: string
  bgColor: string
  icon: IconName
  count?: number
}

const navItems: NavItem[] = [
  { label: 'Today', path: '/today', color: '#666666', bgColor: '#edecea', icon: 'today' },
  { label: 'Contacts', path: '/contacts', color: '#6d8c90', bgColor: '#e3edef', icon: 'contacts' },
  { label: 'Calendar', path: '/calendar', color: '#6484a1', bgColor: '#e4eaf1', icon: 'calendar' },
  { label: 'Tasks', path: '/tasks', color: '#c198ad', bgColor: '#f0e8ee', icon: 'tasks', count: 0 },
  { label: 'Content', path: '/content', color: '#e2b7be', bgColor: '#f8eef0', icon: 'content', count: 0 },
  { label: 'Nurture', path: '/nurture', color: '#8fa790', bgColor: '#e7f0e8', icon: 'nurture', count: 0 },
  { label: 'Goals', path: '/goals', color: '#93738e', bgColor: '#ede8f0', icon: 'goals', count: 0 },
]

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 11,
    height: 11,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }

  switch (name) {
    case 'today':
      return (
        <svg {...common}>
          <path d="M12 4.5v8l5 3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'contacts':
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="currentColor" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="15" rx="3" stroke="currentColor" strokeWidth="2.3" />
          <path d="M8 3.5v3M16 3.5v3M4 10h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'tasks':
      return (
        <svg {...common}>
          <path d="m5 12 3 3 6-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 12h4M15 17h4" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'content':
      return (
        <svg {...common}>
          <path d="M6 4h12a1 1 0 0 1 1 1v14l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M9 8h6M9 12h5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'nurture':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="currentColor" />
        </svg>
      )
    case 'goals':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="M12 4v3M20 12h-3M12 20v-3M4 12h3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common}>
          <path d="M6 18h12l-1.5-2v-4.5a4.5 4.5 0 0 0-9 0V16L6 18Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'sync':
      return (
        <svg {...common}>
          <path d="M20 7v5h-5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 17v-5h5" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18 10a6.5 6.5 0 0 0-11-3M6 14a6.5 6.5 0 0 0 11 3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" stroke="currentColor" strokeWidth="2.2" />
          <path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.9-1.1L14.3 3h-4l-.4 2.9A7 7 0 0 0 8 7L5.6 6l-2 3.4 2 1.5A7 7 0 0 0 5.5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.4 2.9h4l.4-2.9c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1.1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      )
  }
}

function LogoMark() {
  return (
    <span className="flex h-[26px] w-[26px] min-w-[26px] items-center justify-center rounded-[7px] bg-[var(--jamie)] text-white">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3c3 2.4 5.2 5.8 5.2 9.1A5.2 5.2 0 0 1 12 17.3a5.2 5.2 0 0 1-5.2-5.2C6.8 8.8 9 5.4 12 3Z" fill="currentColor" />
        <path d="M8 20c2.4-1.7 5.6-1.7 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  )
}

function IconBubble({ color, bgColor, icon }: { color: string; bgColor: string; icon: IconName }) {
  return (
    <span className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full" style={{ backgroundColor: bgColor, color }}>
      <Icon name={icon} />
    </span>
  )
}

function FooterIcon({ icon }: { icon: IconName }) {
  return (
    <span className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full bg-black/[0.04] text-[var(--muted)]">
      <Icon name={icon} />
    </span>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[150px] min-w-[150px] shrink-0 flex-col border-r-[0.5px] border-[var(--border)] bg-white lg:flex">
      <div className="flex items-center gap-[9px] border-b-[0.5px] border-[var(--border)] px-[10px] pb-[14px] pt-4">
        <LogoMark />
        <span className="font-serif text-[13px] font-semibold leading-none tracking-[-0.2px] text-[var(--text)]">
          SpoonFlow
        </span>
      </div>

      <nav className="flex-1 px-1.5 py-2.5">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `group mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-[12px] leading-none transition-colors ${
                isActive ? 'bg-[var(--text)] text-white' : 'text-[var(--text)] hover:bg-[rgba(44,44,42,0.05)]'
              }`
            }
          >
            <IconBubble color={item.color} bgColor={item.bgColor} icon={item.icon} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {typeof item.count === 'number' && (
              <span className="text-[11px] leading-none text-[var(--muted)] group-[.active]:text-white/55">
                {item.count}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-2 h-px bg-[var(--border)]" />

      <div className="px-1.5 pb-3 pt-1.5">
        <button
          type="button"
          className="mb-0.5 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] leading-none text-[var(--muted)] transition-colors hover:bg-[rgba(44,44,42,0.05)]"
        >
          <FooterIcon icon="bell" />
          <span className="min-w-0 flex-1 truncate">Notifications</span>
          <span className="text-[11px] leading-none text-[var(--muted)]">0</span>
        </button>
        <button
          type="button"
          className="mb-0.5 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] leading-none text-[var(--muted)] transition-colors hover:bg-[rgba(44,44,42,0.05)]"
        >
          <FooterIcon icon="sync" />
          <span className="min-w-0 flex-1 truncate">Sync Calendar</span>
        </button>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `mb-0.5 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] leading-none transition-colors ${
              isActive ? 'bg-[var(--text)] text-white' : 'text-[var(--muted)] hover:bg-[rgba(44,44,42,0.05)]'
            }`
          }
        >
          <FooterIcon icon="settings" />
          <span className="min-w-0 flex-1 truncate">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
