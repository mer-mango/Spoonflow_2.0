import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

const EHS_MTGS_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_EHS_MTGS_CALENDAR_ID || '').trim()

const VIRTUAL_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_VIRTUAL_CALENDAR_ID || '').trim()

const MEDICAL_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_MEDICAL_CALENDAR_ID || '').trim()

const CBC_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_CBC_CALENDAR_ID || '').trim()

const FAMILY_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_FAMILY_CALENDAR_ID || '').trim()

const COMMON_GROUNDS_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_COMMON_GROUNDS_CALENDAR_ID || '').trim()

const TYT_2026_SPRING_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_TYT_2026_SPRING_CALENDAR_ID || '').trim()

const MEREDITH_MANGOLD_CALENDAR_ID =
  (import.meta.env.VITE_GOOGLE_MEREDITH_MANGOLD_CALENDAR_ID || '').trim()

const GOOGLE_PROVIDER_TOKEN_KEY = 'spoonflow_google_provider_token'
const SUGGESTIONS_KEY = 'spoonflow_contact_suggestions'
const MEREDITH_WORK_EMAIL = 'meredith@empowerhealthstrategies.com'

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

export const BUFFER_RULES: Record<
  string,
  {
    duration: number
    type: 'meeting' | 'medical' | 'virtual'
    beforeLabel: string
    afterLabel: string
  }
> = {
  [EHS_MTGS_CALENDAR_ID]: {
    duration: 15,
    type: 'meeting',
    beforeLabel: 'mtg prep',
    afterLabel: 'mtg notes',
  },
  [MEDICAL_CALENDAR_ID]: {
    duration: 45,
    type: 'medical',
    beforeLabel: 'travel time',
    afterLabel: 'travel time',
  },
  [VIRTUAL_CALENDAR_ID]: {
    duration: 15,
    type: 'virtual',
    beforeLabel: 'appt prep',
    afterLabel: 'appt notes',
  },
}

type Contact = {
  id: string
  email: string | null
  color?: string | null
  initials?: string | null
  next_call_date?: string | null
  next_call_date_manual?: boolean | null
  calendar_event_id?: string | null
}

type ManualAssignment = {
  event_id: string
  contact_id: string
}

export type CalendarPerson = {
  email?: string
  displayName?: string
}

export type CalendarEvent = {
  id: string
  title: string
  calendarId?: string
  calendarLabel?: string
  color?: string
  attendees?: CalendarPerson[]
  organizer?: CalendarPerson
  startTime: string
  endTime: string
  meetingLink?: string | null
}

export type EnrichedEvent = CalendarEvent & {
  manualContactAssignment?: string
  contactDetails?: { id: string; color?: string | null; initials?: string | null }
  excludedFromPlanMyDay?: boolean
}

type Suggestion = {
  email: string
  name?: string | null
  eventId?: string
  eventTitle?: string
  eventStartTime?: string
  calendarId?: string
  role?: 'attendee' | 'organizer'
  snoozeUntil?: number
  dismissed?: boolean
}

function normalizeEmail(value?: string | null) {
  return value?.trim().toLowerCase() || null
}

function isMeredithEmail(value?: string | null) {
  return normalizeEmail(value) === normalizeEmail(MEREDITH_WORK_EMAIL)
}

function localDateKeyFromIso(iso: string) {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

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

  window.dispatchEvent(new CustomEvent('spoonflow:contact-suggestions-updated'))
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

function getSavedGoogleProviderToken() {
  return localStorage.getItem(GOOGLE_PROVIDER_TOKEN_KEY)
}

function saveGoogleProviderToken(token: string) {
  localStorage.setItem(GOOGLE_PROVIDER_TOKEN_KEY, token)
}

function meetingLinkFromText(value?: string | null) {
  if (!value) return null

  const urls = value.match(/https?:\/\/[^\s<>"')\]]+/gi) ?? []

  const meetingUrl = urls.find((url) => {
    const normalized = url.toLowerCase()

    return (
      normalized.includes('zoom.us/') ||
      normalized.includes('meet.google.com/') ||
      normalized.includes('teams.microsoft.com/') ||
      normalized.includes('teams.live.com/') ||
      normalized.includes('webex.com/') ||
      normalized.includes('chime.aws/') ||
      normalized.includes('gotomeeting.com/') ||
      normalized.includes('whereby.com/')
    )
  })

  return meetingUrl?.replace(/[.,;!?]+$/, '') ?? null
}

function extractMeetingLink(event: {
  hangoutLink?: string
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType?: string
      uri?: string
    }>
  }
  location?: string
  description?: string
}) {
  const videoConferenceLink =
    event.conferenceData?.entryPoints?.find(
      (entryPoint) => entryPoint.entryPointType === 'video' && entryPoint.uri,
    )?.uri ?? null

  return (
    videoConferenceLink ||
    event.hangoutLink ||
    meetingLinkFromText(event.location) ||
    meetingLinkFromText(event.description) ||
    null
  )
}

function contactMapByEmail(contacts: Contact[]) {
  return new Map(
    contacts
      .filter((contact) => contact.email)
      .map((contact) => [normalizeEmail(contact.email)!, contact]),
  )
}

function contactMapById(contacts: Contact[]) {
  return new Map(contacts.map((contact) => [contact.id, contact]))
}

function peopleForMatching(event: CalendarEvent) {
  const people = new Map<string, CalendarPerson>()

  for (const attendee of event.attendees ?? []) {
    const email = normalizeEmail(attendee.email)

    if (!email || isMeredithEmail(email)) continue

    people.set(email, {
      email,
      displayName: attendee.displayName,
    })
  }

  const organizerEmail = normalizeEmail(event.organizer?.email)

  if (organizerEmail && !isMeredithEmail(organizerEmail)) {
    people.set(organizerEmail, {
      email: organizerEmail,
      displayName: event.organizer?.displayName,
    })
  }

  return Array.from(people.values())
}

function contactIdsForEvent(
  event: CalendarEvent,
  contacts: Contact[],
  manualAssignments: ManualAssignment[],
) {
  const ids = new Set<string>()
  const byEmail = contactMapByEmail(contacts)

  const manual = manualAssignments.find((assignment) => assignment.event_id === event.id)

  if (manual) {
    ids.add(manual.contact_id)
  }

  for (const person of peopleForMatching(event)) {
    const email = normalizeEmail(person.email)
    const contact = email ? byEmail.get(email) : null

    if (contact) {
      ids.add(contact.id)
    }
  }

  return Array.from(ids)
}

function primaryContactIdForEvent(
  event: CalendarEvent,
  contacts: Contact[],
  manualAssignments: ManualAssignment[],
) {
  const manual = manualAssignments.find((assignment) => assignment.event_id === event.id)

  if (manual) {
    return manual.contact_id
  }

  return contactIdsForEvent(event, contacts, manualAssignments)[0] ?? null
}

function contactSuggestionCandidates(event: CalendarEvent) {
  const attendees = event.attendees ?? []
  const totalParticipants = attendees.length

  if (totalParticipants > 3) {
    const organizerEmail = normalizeEmail(event.organizer?.email)

    if (!organizerEmail || isMeredithEmail(organizerEmail)) return []

    return [
      {
        email: organizerEmail,
        name: event.organizer?.displayName ?? null,
        role: 'organizer' as const,
      },
    ]
  }

  const people = new Map<
    string,
    {
      email: string
      name?: string | null
      role: 'attendee' | 'organizer'
    }
  >()

  for (const attendee of attendees) {
    const email = normalizeEmail(attendee.email)

    if (!email || isMeredithEmail(email)) continue

    people.set(email, {
      email,
      name: attendee.displayName ?? null,
      role: 'attendee',
    })
  }

  const organizerEmail = normalizeEmail(event.organizer?.email)

  if (
    organizerEmail &&
    !isMeredithEmail(organizerEmail) &&
    !people.has(organizerEmail)
  ) {
    people.set(organizerEmail, {
      email: organizerEmail,
      name: event.organizer?.displayName ?? null,
      role: 'organizer',
    })
  }

  return Array.from(people.values())
}

export function enrichCalendarEventsWithContacts(
  calendarEvents: CalendarEvent[],
  contacts: Contact[],
  manualAssignments: ManualAssignment[],
) {
  const byId = contactMapById(contacts)
  const byEmail = contactMapByEmail(contacts)

  return calendarEvents.map((event): EnrichedEvent => {
    const manual = manualAssignments.find((assignment) => assignment.event_id === event.id)

    if (manual) {
      const contact = byId.get(manual.contact_id)

      return {
        ...event,
        manualContactAssignment: manual.contact_id,
        contactDetails: contact
          ? { id: contact.id, color: contact.color, initials: contact.initials }
          : undefined,
        excludedFromPlanMyDay: event.calendarId === VIRTUAL_CALENDAR_ID,
      }
    }

    const matchedPerson = peopleForMatching(event).find((person) => {
      const email = normalizeEmail(person.email)
      return email ? byEmail.has(email) : false
    })

    if (matchedPerson?.email) {
      const contact = byEmail.get(normalizeEmail(matchedPerson.email)!)

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

  const email = normalizeEmail(contactEmail)

  const priority2 = future
    .filter((event) =>
      peopleForMatching(event).some(
        (person) => normalizeEmail(person.email) === email,
      ),
    )
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))

  return priority2[0] ?? null
}

async function fetchEventsForCalendar(
  accessToken: string,
  calendarId: string,
): Promise<CalendarEvent[]> {
  const now = new Date()

  const timeMin = new Date(now)
  timeMin.setHours(0, 0, 0, 0)

  const timeMax = new Date(now)
  timeMax.setDate(now.getDate() + 60)
  timeMax.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeCalendarId(
      calendarId,
    )}/events?${params.toString()}`,
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
    description?: string
    location?: string
    hangoutLink?: string
    conferenceData?: {
      entryPoints?: Array<{
        entryPointType?: string
        uri?: string
      }>
    }
    start?: { dateTime?: string; date?: string }
    end?: { dateTime?: string; date?: string }
    attendees?: { email?: string; displayName?: string }[]
    organizer?: { email?: string; displayName?: string }
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
    organizer: event.organizer,
    startTime: event.start?.dateTime ?? `${event.start?.date}T00:00:00`,
    endTime: event.end?.dateTime ?? `${event.end?.date ?? event.start?.date}T23:59:59`,
    meetingLink: extractMeetingLink(event),
  }))
  }

async function fetchGoogleCalendarEvents(accessToken?: string | null): Promise<CalendarEvent[]> {
  if (!accessToken) {
    console.warn('Google Calendar sync skipped: no provider token available.')
    return []
  }

  const calendarIdsToFetch = CALENDAR_IDS.length > 0 ? CALENDAR_IDS : ['primary']

  console.info('Fetching Google calendars:', calendarIdsToFetch)

  const results = await Promise.all(
    calendarIdsToFetch.map((calendarId) => fetchEventsForCalendar(accessToken, calendarId)),
  )

  return results
    .flat()
    .sort((a, b) => +new Date(a.startTime) - +new Date(b.startTime))
}

async function syncNextMeetingDates(
  contacts: Contact[],
  events: CalendarEvent[],
  manualAssignments: ManualAssignment[],
) {
  const now = Date.now()
  const earliestUpcomingByContact = new Map<string, CalendarEvent>()

  const futureEvents = events.filter((event) => new Date(event.startTime).getTime() > now)

  for (const event of futureEvents) {
    const contactIds = contactIdsForEvent(event, contacts, manualAssignments)

    for (const contactId of contactIds) {
      const current = earliestUpcomingByContact.get(contactId)

      if (
        !current ||
        new Date(event.startTime).getTime() < new Date(current.startTime).getTime()
      ) {
        earliestUpcomingByContact.set(contactId, event)
      }
    }
  }

  const updates = contacts
    .filter((contact) => !contact.next_call_date_manual)
    .flatMap((contact) => {
      const event = earliestUpcomingByContact.get(contact.id)

      if (!event) return []

      const nextCallChanged = contact.next_call_date !== event.startTime
      const linkedEventChanged = contact.calendar_event_id !== event.id

      if (!nextCallChanged && !linkedEventChanged) return []

      return [
        supabase
          .from('contacts')
          .update({
            next_call_date: event.startTime,
            calendar_event_id: event.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contact.id),
      ]
    })

  if (updates.length > 0) {
    await Promise.all(updates)
  }
}

async function syncEhsMeetingInteractions(
  userId: string,
  contacts: Contact[],
  events: CalendarEvent[],
  manualAssignments: ManualAssignment[],
) {
  const ehsEvents = events.filter((event) => event.calendarId === EHS_MTGS_CALENDAR_ID)

  if (ehsEvents.length === 0) return

  const calendarEventIds = ehsEvents.map((event) => event.id)

  const { data: existingInteractions } = await supabase
    .from('contact_interactions')
    .select('id,calendar_event_id')
    .in('calendar_event_id', calendarEventIds)

  const existingByCalendarEventId = new Map(
    (existingInteractions ?? []).map((interaction) => [
      interaction.calendar_event_id,
      interaction,
    ]),
  )

  const inserts: Array<Record<string, string | boolean | null>> = []
  const updatePromises: PromiseLike<unknown>[] = []

  for (const event of ehsEvents) {
    const contactId = primaryContactIdForEvent(event, contacts, manualAssignments)

    if (!contactId) continue

    const payload = {
      contact_id: contactId,
      interaction_type: 'meeting',
      title: event.title,
      interaction_date: localDateKeyFromIso(event.startTime),
      start_time: event.startTime,
      end_time: event.endTime,
      source: 'google_calendar',
      calendar_event_id: event.id,
      updated_at: new Date().toISOString(),
    }

    const existing = existingByCalendarEventId.get(event.id)

    if (existing?.id) {
      updatePromises.push(
        supabase
          .from('contact_interactions')
          .update(payload)
          .eq('id', existing.id),
      )
    } else {
      inserts.push({
        user_id: userId,
        ...payload,
        prep_notes: null,
        during_meeting_notes: null,
        fathom_url: null,
        post_meeting_summary: null,
        full_transcript: null,
        follow_up_meeting_needed: null,
        thank_you_email_notes: null,
        archived: false,
      })
    }
  }

  if (inserts.length > 0) {
    await supabase.from('contact_interactions').insert(inserts)
  }

  if (updatePromises.length > 0) {
    await Promise.all(updatePromises)
  }
}

function syncContactSuggestions(contacts: Contact[], events: CalendarEvent[]) {
  const existingContactEmails = new Set(
    contacts
      .flatMap((contact) => (contact.email ? [normalizeEmail(contact.email)] : []))
      .filter((email): email is string => Boolean(email)),
  )

  const queue = readSuggestions()
  const now = Date.now()
  const merged = [...queue]

  for (const event of events) {
    const candidates = contactSuggestionCandidates(event)

    for (const candidate of candidates) {
      if (existingContactEmails.has(candidate.email)) continue

      const alreadyQueued = merged.find(
        (item) =>
          item.email === candidate.email &&
          !item.dismissed &&
          (!item.snoozeUntil || item.snoozeUntil < now),
      )

      if (alreadyQueued) continue

      merged.push({
        email: candidate.email,
        name: candidate.name ?? null,
        eventId: event.id,
        eventTitle: event.title,
        eventStartTime: event.startTime,
        calendarId: event.calendarId,
        role: candidate.role,
      })
    }
  }

  writeSuggestions(merged)
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

      const liveProviderToken = session?.provider_token ?? null
      const userId = session?.user?.id ?? null

      if (liveProviderToken) {
        saveGoogleProviderToken(liveProviderToken)
      }

      const googleProviderToken = liveProviderToken || getSavedGoogleProviderToken()

      if (!googleProviderToken) {
        console.warn(
          'No Google provider token found. Reconnect Google Calendar from Settings → Integrations.',
        )

        setCalendarEvents([])
        setEnrichedCalendarEvents([])
        return
      }

      const { data: contacts } = await supabase
        .from('contacts')
        .select(
          'id,email,color,initials,next_call_date,next_call_date_manual,calendar_event_id',
        )

      const { data: manualAssignments } = await supabase
        .from('calendar_manual_assignments')
        .select('event_id,contact_id')

      const safeContacts = (contacts ?? []) as Contact[]
      const safeAssignments = (manualAssignments ?? []) as ManualAssignment[]

      const events = await fetchGoogleCalendarEvents(googleProviderToken)
      const enriched = enrichCalendarEventsWithContacts(
        events,
        safeContacts,
        safeAssignments,
      )

      setCalendarEvents(events)
      setEnrichedCalendarEvents(enriched)
      setLastSynced(new Date().toISOString())

      await syncNextMeetingDates(safeContacts, events, safeAssignments)

      if (userId) {
        await syncEhsMeetingInteractions(userId, safeContacts, events, safeAssignments)
      }

      syncContactSuggestions(safeContacts, events)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void syncCalendar()
  }, [syncCalendar])

  return useMemo(
    () => ({
      calendarEvents,
      enrichedCalendarEvents,
      syncCalendar,
      lastSynced,
      isLoading,
    }),
    [calendarEvents, enrichedCalendarEvents, syncCalendar, lastSynced, isLoading],
  )
}
