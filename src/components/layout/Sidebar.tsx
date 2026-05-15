import { NavLink } from 'react-router-dom'
import { useTasks } from '../../hooks/useTasks'

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
  icon: IconName
  count?: number
}

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    'aria-hidden': true,
  }

  switch (name) {
    case 'today':
      return (
        <svg {...common}>
          <path d="M4 10.5 12 4l8 6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6.5 10v9h11v-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19v-5h4v5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'contacts':
      return (
        <svg {...common}>
          <path d="M9.5 11.5a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" stroke="currentColor" strokeWidth="2.3" />
          <path d="M3.8 19.5a5.7 5.7 0 0 1 11.4 0" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M16 11.2a2.8 2.8 0 1 0 0-5.6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
          <path d="M17.2 14.2a5 5 0 0 1 3 5.3" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )

    case 'calendar':
      return (
        <svg {...common}>
          <rect x="4" y="5.5" width="16" height="15" rx="2.8" stroke="currentColor" strokeWidth="2.3" />
          <path d="M8 3.5v4M16 3.5v4M4 10h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      )

    case 'tasks':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2.3" />
          <path d="m8 12.2 2.5 2.5L16.5 8.8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'content':
      return (
        <svg {...common}>
          <path d="M14.7 4.8 19.2 9.3 9.1 19.4 4.6 20.2 5.4 15.7 14.7 4.8Z" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.2 6.5 17.5 10.8" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        </svg>
      )

    case 'nurture':
      return (
        <svg {...common}>
          <path d="M12 20v-8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M12 12c-4.2-.2-6.8-2.5-7-6.7 4.2.2 6.8 2.5 7 6.7Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M12 13c4.2-.2 6.8-2.5 7-6.7-4.2.2-6.8 2.5-7 6.7Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        </svg>
      )

    case 'goals':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.3" />
          <circle cx="12" cy="12" r="4.4" stroke="currentColor" strokeWidth="2.3" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
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
          <path d="M19 12a7 7 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.9-1.1L14.3 3h-4l-.4 2.9A7 7 0 0 0 8 7L5.6 6 3.6 9.4l2 1.5A7 7 0 0 0 5.5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1c.6.5 1.2.8 1.9 1.1l.4 2.9h4l.4-2.9c.7-.3 1.3-.6 1.9-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1.1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      )
  }
}

function LogoMark() {
  return (
    <span className="flex h-[26px] w-[26px] min-w-[26px] items-center justify-center rounded-full bg-[#17233c] text-white shadow-sm">
      <Icon name="nurture" />
    </span>
  )
}

function IconBubble({ color, icon, active }: { color: string; icon: IconName; active?: boolean }) {
  return (
    <span
      className="flex h-7 w-7 min-w-7 items-center justify-center rounded-full text-white transition"
      style={{ backgroundColor: active ? 'rgba(255,255,255,0.18)' : color }}
    >
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
  const { openTasks } = useTasks()

  const navItems: NavItem[] = [
    { label: 'Today', path: '/today', color: '#45556c', icon: 'today' },
    { label: 'Contacts', path: '/contacts', color: '#8ba5a8', icon: 'contacts' },
    { label: 'Calendar', path: '/calendar', color: '#6684a1', icon: 'calendar' },
    {
      label: 'Tasks',
      path: '/tasks',
      color: '#c198ad',
      icon: 'tasks',
      count: openTasks.length,
    },
    { label: 'Content', path: '/content', color: '#e2b7be', icon: 'content' },
    { label: 'Nurture', path: '/nurture', color: '#8fa790', icon: 'nurture' },
    { label: 'Goals', path: '/goals', color: '#a389aa', icon: 'goals' },
  ]

  return (
    <aside className="hidden h-screen w-[160px] min-w-[160px] shrink-0 flex-col border-r border-[var(--border)] bg-white lg:flex">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 pb-4 pt-4">
        <LogoMark />
        <span className="font-serif text-[13px] font-semibold leading-none tracking-[-0.2px] text-[var(--text)]">
          SpoonFlow
        </span>
      </div>

      <nav className="flex-1 px-2 py-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `mb-1 flex cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-[12.5px] leading-none transition-all ${
                isActive
                  ? 'font-medium text-white shadow-[0_6px_14px_rgba(69,85,108,0.18)]'
                  : 'text-[#26344f] hover:bg-black/[0.04]'
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? item.color : undefined,
            })}
          >
            {({ isActive }) => (
              <>
                <IconBubble color={item.color} icon={item.icon} active={isActive} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>

                {typeof item.count === 'number' && item.count > 0 && (
                  <span className={`text-[11px] leading-none ${isActive ? 'text-white/80' : 'text-[var(--muted)]'}`}>
                    {item.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 h-px bg-[var(--border)]" />

      <div className="px-2 pb-3 pt-2">
       <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('spoonflow:sync-google-calendar'))
          }}
          className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-left text-[12px] leading-none text-[var(--muted)] transition-colors hover:bg-black/[0.04]"
        >
          <FooterIcon icon="sync" />
          <span className="min-w-0 flex-1 truncate">Sync Calendar</span>
        </button>

        <button
          type="button"
          className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-left text-[12px] leading-none text-[var(--muted)] transition-colors hover:bg-black/[0.04]"
        >
          <FooterIcon icon="sync" />
          <span className="min-w-0 flex-1 truncate">Sync Calendar</span>
        </button>

        <NavLink
          to="/settings/integrations"
          className={({ isActive }) =>
            `mb-1 flex cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-left text-[12px] leading-none transition-colors ${
              isActive ? 'bg-[#2c2c2a] text-white' : 'text-[var(--muted)] hover:bg-black/[0.04]'
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
