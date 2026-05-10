import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MenuItem = {
  label: string
  dotBg: string
  iconColor: string
  kind: 'check' | 'calendar' | 'task' | 'swirl' | 'sparkle' | 'plus' | 'contact' | 'goal' | 'pencil'
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
          <path d="M5.7 1.5 7.5 3.3 3.5 7.3 1.6 7.7 
