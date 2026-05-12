import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MenuItem = {
  label: string
  dotBg: string
  iconColor: string
  kind:
    | 'check'
    | 'calendar'
    | 'task'
    | 'swirl'
    | 'sparkle'
    | 'plus'
    | 'contact'
    | 'goal'
    | 'pencil'
  action?: () => void
  emphasized?: boolean
}

function MiniIcon({ kind, color }: { kind: MenuItem['kind']; color: string }) {
  switch (kind) {
    case 'check':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="2.8" stroke={color} strokeWidth="1.1" />
          <path d="M3 4.5 4.2 5.7 6.4 3.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'calendar':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <rect x="1" y="1.5" width="7" height="6" rx="1" stroke={color} strokeWidth="1.1" />
          <path d="M1 3h7" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )

    case 'task':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.1" />
          <path d="M2.5 4.5 4 6l2.5-2.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )

    case 'swirl':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <path d="M6 4.5A1.5 1.5 0 1 1 4.5 3" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )

    case 'sparkle':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <path d="m4.5 1-.5 1-1.2.2.8.7-.2 1.3 1.1-.4 1.1.4-.2-1.3.8-.7L5 2Z" stroke={color} strokeWidth="1" strokeLinejoin="round" />
        </svg>
      )

    case 'pencil':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <path
            d="M5.8 1.3 7.7 3.2 3.5 7.4 1.2 7.8 1.6 5.5 5.8 1.3Z"
            stroke={color}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M5.1 2 7 3.9" stroke={color} strokeWidth="1" strokeLinecap="round" />
        </svg>
      )

    case 'plus':
    case 'goal':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <circle cx="4.5" cy="4.5" r="3" stroke={color} strokeWidth="1.1" />
          <path d="M4.5 3v3M3 4.5h3" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )

    case 'contact':
      return (
        <svg viewBox="0 0 9 9" fill="none" aria-hidden="true">
          <circle cx="4.5" cy="3" r="1.7" stroke={color} strokeWidth="1.1" />
          <path d="M1.5 8c0-1.6 1.3-2.5 3-2.5s3 .9 3 2.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      )
  }
}

function MenuDot({ item }: { item: MenuItem }) {
  return (
    <span className="flex h-4 w-4 min-w-4 items-center justify-center rounded-full" style={{ backgroundColor: item.dotBg }}>
      <span className="h-[9px] w-[9px]">
        <MiniIcon kind={item.kind} color={item.iconColor} />
      </span>
    </span>
  )
}

function JamieSparkle() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M5.5 1 4.8 3.8 2 4.5l2.8.7.7 2.8.7-2.8 2.8-.7-2.8-.7L5.5 1Z" fill="currentColor" />
    </svg>
  )
}

export function TopBar() {
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<'jamie' | 'create' | null>(null)

  const jamieItems: MenuItem[] = [
    {
      label: 'Plan My Day',
      dotBg: '#edf2ee',
      iconColor: '#8fa790',
      kind: 'check',
      action: () => window.dispatchEvent(new CustomEvent('spoonflow:open-plan-my-day')),
},        
    { label: 'Post-Meeting Debrief', dotBg: '#f2eaf0', iconColor: '#c198ad', kind: 'task' },
    { label: 'PM Wind Down', dotBg: '#eef4f4', iconColor: '#bcd1d5', kind: 'swirl' },
    { label: 'Open Chat', dotBg: '#f3eaf1', iconColor: '#6b2358', kind: 'plus', emphasized: true },
  ]

  const createItems: MenuItem[] = [
    { label: 'New Contact', dotBg: '#e8f0f0', iconColor: '#8ba5a8', kind: 'contact', action: () => navigate('/contacts/new') },
    { label: 'New Task', dotBg: '#f2eaf0', iconColor: '#c198ad', kind: 'task', action: () => navigate('/tasks/new') },
    { label: 'New Content Idea', dotBg: '#faf2f3', iconColor: '#e2b7be', kind: 'pencil', action: () => navigate('/content/new') },
    { label: 'New Goal', dotBg: '#ede8f0', iconColor: '#93738e', kind: 'goal', action: () => navigate('/goals') },
  ]

  const renderMenu = (items: MenuItem[], alignClass: string) => (
    <div className={`absolute top-9 z-[500] min-w-[180px] rounded-[9px] border-[0.5px] border-[var(--border)] bg-white p-[3px] shadow-[0_4px_14px_rgba(0,0,0,0.1)] ${alignClass}`}>
      {items.map((item, index) => (
        <button
          key={item.label}
          type="button"
          className={`flex w-full cursor-pointer items-center gap-[7px] rounded-md px-2 py-[7px] text-left text-[12px] leading-none hover:bg-[#f5f3f0] ${
            item.emphasized ? 'font-medium text-[var(--jamie)]' : 'text-[var(--text)]'
          } ${index === items.length - 1 && item.emphasized ? 'mt-[3px] border-t-[0.5px] border-[var(--border)] pt-[7px]' : ''}`}
          onClick={() => {
            item.action?.()
            setOpenMenu(null)
          }}
        >
          <MenuDot item={item} />
          {item.label}
        </button>
      ))}
    </div>
  )

  return (
    <header className="mb-4 flex items-center justify-end gap-[7px]">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((value) => (value === 'jamie' ? null : 'jamie'))}
          className="flex cursor-pointer items-center gap-[5px] rounded-[18px] bg-[var(--jamie)] py-[7px] pl-[10px] pr-3 font-sans text-[11.5px] font-medium leading-none text-white transition-colors hover:bg-[#5a1d4a]"
        >
          <JamieSparkle />
          Ask Jamie
        </button>
        {openMenu === 'jamie' && renderMenu(jamieItems, 'right-9')}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu((value) => (value === 'create' ? null : 'create'))}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--jamie)] font-sans text-xl leading-none text-white transition-colors hover:bg-[#5a1d4a]"
          aria-label="Create new"
        >
          +
        </button>
        {openMenu === 'create' && renderMenu(createItems, 'right-0')}
      </div>
    </header>
  )
}
