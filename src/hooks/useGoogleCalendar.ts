import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const EHS_MTGS_CALENDAR_ID = import.meta.env.VITE_GOOGLE_EHS_MTGS_CALENDAR_ID || ''
const VIRTUAL_CALENDAR_ID = import.meta.env.VITE_GOOGLE_VIRTUAL_CALENDAR_ID || ''
const MEDICAL_CALENDAR_ID = import.meta.env.VITE_GOOGLE_MEDICAL_CALENDAR_ID || ''
const CBC_CALENDAR_ID = import.meta.env.VITE_GOOGLE_CBC_CALENDAR_ID || ''
const FAMILY_CALENDAR_ID = import.meta.env.VITE_GOOGLE_FAMILY_CALENDAR_ID || ''
const COMMON_GROUNDS_CALENDAR_ID = import.meta.env.VITE_GOOGLE_COMMON_GROUNDS_CALENDAR_ID || ''
const TYT_2026_SPRING_CALENDAR_ID = import.meta.env.VITE_GOOGLE_TYT_2026_SPRING_CALENDAR_ID || ''
const MEREDITH_MANGOLD_CALENDAR_ID = import.meta.env.VITE_GOOGLE_MEREDITH_MANGOLD_CALENDAR_ID || ''

const CALENDAR_IDS = Array.from(
  new Set(
    [
      EHS_MTGS_CALENDAR_ID,
      VIRTUAL_CALENDAR_ID,
      MEDICAL_CALENDAR_ID,
      CBC_CALENDAR_ID,
      FAMILY_CALENDAR_ID,
      COMMON_GROUNDS_CALENDAR_ID,
      TYT_2026_SPRING_CALENDAR_ID,
      MEREDITH_MANGOLD_CALENDAR_ID,
    ]
      .map((id) => id.trim())
      .filter(Boolean),
  ),
)

export const CALENDAR_COLORS: Record<string, string> = {
  [EHS_MTGS_CALENDAR_ID]: '#6484a1',
  [VIRTUAL_CALENDAR_ID]: '#d4a77a',
  [MEDICAL_CALENDAR_ID]: '#c9888e',
  [CBC_CALENDAR_ID]: '#c198ad',
  [FAMILY_CALENDAR_ID]: '#e1d6cb',
  [COMMON_GROUNDS_CALENDAR_ID]: '#918585',
  [TYT_2026_SPRING_CALENDAR_ID]: '#bcd1d5',
  [MEREDITH_MANGOLD_CALENDAR_ID]: '#93738e',
}

export const CALENDAR_LABELS: Record<string, string> = {
  [EHS_MTGS_CALENDAR_ID]: 'EHS Mtgs',
  [VIRTUAL_CALENDAR_ID]: 'Virtual Appts',
  [MEDICAL_CALENDAR_ID]: 'Medical Appts',
  [CBC_CALENDAR_ID]: 'CBC',
  [FAMILY_CALENDAR_ID]: 'Family',
  [COMMON_GROUNDS_CALENDAR_ID]: 'Common Grounds',
  [TYT_2026_SPRING_CALENDAR_ID]: 'TYT 2026 Spring',
  [MEREDITH_MANGOLD_CALENDAR_ID]: 'Meredith Mangold',
}

export const BUFFER_RULES: Record<string, { duration: number; type: 'prep' | 'travel' }> = {
  [EHS_MTGS_CALENDAR_ID]: { duration: 15, type: 'prep' },
  [MEDICAL_CALENDAR_ID]: { duration: 45, type: 'travel' },
  [VIRTUAL_CALENDAR_ID]: { duration: 15, type: 'prep' },
}

type Contact = {
  id: string
  email: string | null
  color?: string | null
  initials?: string | null
}

export type CalendarEvent = {
  id: string
  title: string
  calendarId?: string
  calendarLabel?: string
  color?: string
  attendees?: { email?: string }[]
  startTime: string
  endTime: string
}

export type EnrichedEvent = CalendarEvent & {
  manualContactAssignment?: string
  contactDetails?: { id: string; color?: string | null; initials?: string | null }
  excludedFromPlanMyDay?: boolean
}

type Suggestion = {
  email: string
  snoozeUntil?: number
  dismissed?: boolean
}

const SUGGESTIONS_KEY = 'spoonflow_contact_suggestions'

function readSuggestions() {
  const raw = localStorage.getItem(SUGGESTIONS_KEY)
  if (!raw) return [] as Suggestion[]

  try {
    return JSON.parse(raw) as Suggestion[]
  } catch {
    return []
  }
}

function writeSuggestions(queue: Suggestion[]) {
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(queue))
}

function encodeCalendarId(calendarId: string) {
  return encodeURIComponent(calendarId)
}

function getCalendarColor(calendarId: string) {
  return CALENDAR_COLORS[calendarId] || '#6484a1'
}

function getCalendarLabel(calendarId: string) {
  return CALENDAR_LABELS[calendarId] || 'Calendar'
}

export function enrichCalendarEventsWithContacts(
  calendarEvents: CalendarEvent[],
  contacts: Contact[],
  manualAssignments: { event_id: string; contact_id: string }[],
) {
  const contactById = new Map(contacts.map((contact) => [contact.id, contact]))

  const contactByEmail = new Map(
    contacts
      .filter((contact) => contact.email)
      .map((contact) => [contact.email!.toLowerCase(), contact]),
  )

  return calendarEvents.map((event): EnrichedEvent => {
    const manual = manualAssignments.find((assignment) => assignment.event_id === event.id)

    if (manual) {
      const contact = contactById.get(manual.contact_id)

      return {
        ...event,
        manualContactAssignment: manual.contact_id,
        contactDetails: contact
          ? { id: contact.id, color: contact.color, initials: contact.initials }
          : undefined,
        excludedFromPlanMyDay: event.calendarId === VIRTUAL_CALENDAR_ID,
      }
    }

    const matched = event.attendees?.find(
      (attendee) => attendee.email && contactByEmail.has(attendee.email.toLowerCase()),
    )

    if (matched?.email) {
      const contact = contactByEmail.get(matched.email.toLowerCase())

      return {
        ...event,
        contactDetails: contact
          ? { id: contact.id, color: contact.color, initials: contact.initials }
          : undefined,
        excludedFromPlanMyDay: event.calendarId === VIRTUAL_CALENDAR_ID,
      }
    }

    return {
      ...event,
      excludedFromPlanMyDay: event.calendarId === VIRTUAL_CALENDAR_ID,
    }
  })
}

export function findNextCalendarEvent(
  contactId: string,
  contactEmail: string | null,
  enrichedEvents: EnrichedEvent[],
) {
  const now = Date.now()
  const future = enrichedEvents.filter((event) => new Date(event.startTime).getTime() > now)

  const priority1 = future
    .filter((event) => event.contactDetails?.id === contactId)
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))

  if (priority1.length > 0) return priority1[0]

  if (!contactEmail) return null

  const email = contactEmail.toLowerCase()

  const priority2 = future
    .filter((event) => event.attendees?.some((attendee) => attendee.email?.toLowerCase() === email))
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))

  return priority2[0] ?? null
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
): Promise<CalendarEvent[]> {
  const now = new Date()
  const timeMax = new Date()
  timeMax.setDate(now.getDate() + 60)

  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeCalendarId(calendarId)}/events?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  )

  if (!response.ok) {
    console.warn(`Google Calendar fetch failed for ${calendarId}`, await response.text())
    return []
  }

  const data = (await response.json()) as {
    items?: Array<{
      id: string
      summary?: string
      start?: { dateTime?: string; date?: string }
      end?: { dateTime?: string; date?: string }
      attendees?: { email?: string }[]
    }>
  }

  return (data.items ?? [])
    .filter((event) => event.start?.dateTime || event.start?.date)
    .map((event) => ({
      id: `${calendarId}-${event.id}`,
      title: event.summary || 'Untitled event',
      calendarId,
      calendarLabel: getCalendarLabel(calendarId),
      color: getCalendarColor(calendarId),
      attendees: event.attendees ?? [],
      startTime: event.start?.dateTime ?? `${event.start?.date}T00:00:00`,
      endTime: event.end?.dateTime ?? `${event.end?.date ?? event.start?.date}T23:59:59`,
    }))
}

async function fetchGoogleCalendarEvents(accessToken?: string | null): Promise<CalendarEvent[]> {
  if (!accessToken) return []

  const calendarIdsToFetch = CALENDAR_IDS.length > 0 ? CALENDAR_IDS : ['primary']

  const results = await Promise.all(
    calendarIdsToFetch.map((calendarId) => fetchEventsForCalendar(accessToken, calendarId)),
  )

  return results
    .flat()
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
}

export function useGoogleCalendar() {
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [enrichedCalendarEvents, setEnrichedCalendarEvents] = useState<EnrichedEvent[]>([])
  const [lastSynced, setLastSynced] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const syncCalendar = useCallback(async () => {
    setIsLoading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setCalendarEvents([])
        setEnrichedCalendarEvents([])
        return
      }

      const { data: contacts } = await supabase.from('contacts').select('id,email,color,initials')

      const { data: manualAssignments } = await supabase
        .from('calendar_manual_assignments')
        .select('event_id,contact_id')

      const events = await fetchGoogleCalendarEvents(session.provider_token)
      const enriched = enrichCalendarEventsWithContacts(events, contacts ?? [], manualAssignments ?? [])

      setCalendarEvents(events)
      setEnrichedCalendarEvents(enriched)
      setLastSynced(new Date().toISOString())

      const existing = new Set(
        (contacts ?? []).flatMap((contact) =>
          contact.email ? [contact.email.toLowerCase()] : [],
        ),
      )

      const queue = readSuggestions()
      const now = Date.now()

      const unknowns = enriched.flatMap((event) =>
        (event.attendees ?? [])
          .map((attendee) => attendee.email?.toLowerCase())
          .filter((email): email is string => Boolean(email) && !existing.has(email)),
      )

      const merged = [...queue]

      for (const email of unknowns) {
        const present = merged.find(
          (item) =>
            item.email === email &&
            !item.dismissed &&
            (!item.snoozeUntil || item.snoozeUntil < now),
        )

        if (!present) merged.push({ email })
      }

      writeSuggestions(merged)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncCalendar()
  }, [syncCalendar])

  const value = useMemo(
    () => ({ calendarEvents, enrichedCalendarEvents, syncCalendar, lastSynced, isLoading }),
    [calendarEvents, enrichedCalendarEvents, syncCalendar, lastSynced, isLoading],
  )

  return value
}
