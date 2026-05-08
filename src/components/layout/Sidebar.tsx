import { NavLink } from 'react-router-dom'
import {
  CalendarDays,
  CheckSquare,
  Home,
  Pin,
  Sprout,
  Target,
  UsersRound,
  Bell,
  RefreshCw,
  Settings,
} from 'lucide-react'

type NavItem = {
  label: string
  path: string
  color: string
  count?: number
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const navItems: NavItem[] = [
  {
    label: 'Today',
    path: '/today',
    color: '#45556c',
    icon: Home,
  },
  {
    label: 'Contacts',
    path: '/contacts',
    color: '#8ba5a8',
    icon: UsersRound,
  },
  {
    label: 'Calendar',
    path: '/calendar',
    color: '#6684a1',
    icon: CalendarDays,
  },
  {
    label: 'Tasks',
    path: '/tasks',
    color: '#c198ad',
    icon: CheckSquare,
    count: 0,
  },
  {
    label: 'Content',
    path: '/content',
    color: '#e2b7be',
    icon: Pin,
    count: 0,
  },
  {
    label: 'Nurture',
    path: '/nurture',
    color: '#8fa790',
    icon: Sprout,
    count: 0,
  },
  {
    label: 'Goals',
    path: '/goals',
    color: '#a389aa',
    icon: Target,
    count: 0,
  },
]

function LogoMark() {
  return (
    <span className="flex h-[26px] w-[26px] min-w-[26px] items-center justify-center rounded-full bg-[#17233c] text-white shadow-sm">
      <Sprout size={13} strokeWidth={2.4} />
    </span>
  )
}

function IconBubble({
  color,
  icon: Icon,
  active,
}: {
  color: string
  icon: NavItem['icon']
  active?: boolean
}) {
  return (
    <span
      className="flex h-7 w-7 min-w-7 items-center justify-center rounded-full text-white transition"
      style={{ backgroundColor: active ? 'rgba(255,255,255,0.18)' : color }}
    >
      <Icon size={15} strokeWidth={2.35} />
    </span>
  )
}

function FooterIcon({
  icon: Icon,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}) {
  return (
    <span className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full bg-black/[0.04] text-[var(--muted)]">
      <Icon size={12} strokeWidth={2.4} />
    </span>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-[160px] min-w-[160px] shrink-0 flex-col border-r border-[var(--border)] bg-white lg:flex">
      <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-3 pb-4 pt-4">
        <LogoMark />
        <span className="font-serif text-[13px] font-semibold leading-none tracking-[-0.2px] text-[var(--text)]">
          SpoonFlow
        </span>
      </div>

      <nav className="flex-1 px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mb-1 flex cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-[12.5px] leading-none transition-all ${
                  isActive
                    ? 'bg-[#45556c] font-medium text-white shadow-[0_6px_14px_rgba(69,85,108,0.22)]'
                    : 'text-[#26344f] hover:bg-black/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <IconBubble color={item.color} icon={Icon} active={isActive} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>

                  {typeof item.count === 'number' && (
                    <span
                      className={`text-[11px] leading-none ${
                        isActive ? 'text-white/80' : 'text-[var(--muted)]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="mx-3 h-px bg-[var(--border)]" />

      <div className="px-2 pb-3 pt-2">
        <button
          type="button"
          className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-left text-[12px] leading-none text-[var(--muted)] transition-colors hover:bg-black/[0.04]"
        >
          <FooterIcon icon={Bell} />
          <span className="min-w-0 flex-1 truncate">Notifications</span>
          <span className="text-[11px] leading-none text-[var(--muted)]">0</span>
        </button>

        <button
          type="button"
          className="mb-1 flex w-full cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-left text-[12px] leading-none text-[var(--muted)] transition-colors hover:bg-black/[0.04]"
        >
          <FooterIcon icon={RefreshCw} />
          <span className="min-w-0 flex-1 truncate">Sync Calendar</span>
        </button>

        <NavLink
          to="/settings/integrations"
          className={({ isActive }) =>
            `mb-1 flex cursor-pointer items-center gap-2 rounded-full px-2.5 py-2 text-left text-[12px] leading-none transition-colors ${
              isActive
                ? 'bg-[#2c2c2a] text-white'
                : 'text-[var(--muted)] hover:bg-black/[0.04]'
            }`
          }
        >
          <FooterIcon icon={Settings} />
          <span className="min-w-0 flex-1 truncate">Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
