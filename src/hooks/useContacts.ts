import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Contact = {
  id: string
  user_id?: string
  name: string
  role: string | null
  company: string | null
  email: string | null
  linkedin_url?: string | null
  scheduling_link?: string | null
  website?: string | null
  city?: string | null
  state?: string | null
  about?: string | null
  from_note?: string | null
  color: string | null
  initials?: string | null
  image_url?: string | null
  starred: boolean
  nurture_frequency_days?: number | null
  next_nurture_date?: string | null
  next_call_date: string | null
  next_call_date_manual?: boolean | null
  calendar_event_id?: string | null
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
}

type ContactInput = Partial<Contact> & {
  name: string
}

type ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

const CONTACT_SELECT = `
  id,
  user_id,
  name,
  role,
  company,
  email,
  linkedin_url,
  scheduling_link,
  website,
  city,
  state,
  about,
  from_note,
  color,
  initials,
  image_url,
  starred,
  nurture_frequency_days,
  next_nurture_date,
  next_call_date,
  next_call_date_manual,
  calendar_event_id,
  notes,
  created_at,
  updated_at
`

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null
}

function makeInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function cleanText(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : null
}

function parseBoolean(value?: string | null) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return ['true', 'yes', 'y', '1', 'starred', 'favorite', 'favourite'].includes(normalized)
}

function parseNumber(value?: string | null) {
  if (!value) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function parseDate(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const date = new Date(trimmed)

  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

function splitCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && insideQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === ',' && !insideQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())

  return cells
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((line) => line.trim().length > 0)

  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, ''),
  )

  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = cells[index]?.trim() ?? ''
    })

    return row
  })
}

function getValue(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const key = alias
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')

    if (row[key]) return row[key]
  }

  return ''
}

function rowToContactInput(row: Record<string, string>): ContactInput | null {
  const firstName = getValue(row, ['first name', 'first_name'])
  const lastName = getValue(row, ['last name', 'last_name'])

  const name =
    cleanText(getValue(row, ['name', 'full name', 'full_name', 'contact', 'contact name'])) ||
    cleanText(`${firstName} ${lastName}`)

  const email = normalizeEmail(getValue(row, ['email', 'email address', 'primary email', 'work email']))

  if (!name && !email) return null

  const finalName = name || email || 'Unnamed contact'

  return {
    name: finalName,
    email,
    role: cleanText(getValue(row, ['role', 'title', 'job title', 'job_title', 'position'])),
    company: cleanText(getValue(row, ['company', 'organization', 'organisation', 'account'])),
    linkedin_url: cleanText(getValue(row, ['linkedin', 'linkedin url', 'linkedin_url', 'linkedin profile'])),
    scheduling_link: cleanText(getValue(row, ['scheduling link', 'scheduling_link', 'calendly', 'booking link'])),
    website: cleanText(getValue(row, ['website', 'company website', 'url'])),
    city: cleanText(getValue(row, ['city'])),
    state: cleanText(getValue(row, ['state', 'province', 'region'])),
    about: cleanText(getValue(row, ['about', 'description', 'bio'])),
    from_note: cleanText(getValue(row, ['from', 'from note', 'from_note', 'how we met', 'source'])),
    notes: cleanText(getValue(row, ['notes', 'note', 'general notes'])),
    color: cleanText(getValue(row, ['color'])) || '#8ba5a8',
    initials: cleanText(getValue(row, ['initials'])) || makeInitials(finalName),
    starred: parseBoolean(getValue(row, ['starred', 'favorite', 'favourite'])),
    nurture_frequency_days: parseNumber(
      getValue(row, ['nurture frequency', 'nurture_frequency', 'nurture_frequency_days', 'cadence']),
    ),
    next_nurture_date: parseDate(getValue(row, ['next nurture date', 'next_nurture_date'])),
    next_call_date: parseDate(getValue(row, ['next meeting', 'next_call_date', 'next call date', 'next meeting date'])),
  }
}

function prepareForInsertOrUpdate(contact: ContactInput, userId: string) {
  return {
    user_id: userId,
    name: contact.name,
    role: contact.role ?? null,
    company: contact.company ?? null,
    email: normalizeEmail(contact.email),
    linkedin_url: contact.linkedin_url ?? null,
    scheduling_link: contact.scheduling_link ?? null,
    website: contact.website ?? null,
    city: contact.city ?? null,
    state: contact.state ?? null,
    about: contact.about ?? null,
    from_note: contact.from_note ?? null,
    color: contact.color ?? '#8ba5a8',
    initials: contact.initials ?? makeInitials(contact.name),
    starred: contact.starred ?? false,
    nurture_frequency_days: contact.nurture_frequency_days ?? null,
    next_nurture_date: contact.next_nurture_date ?? null,
    next_call_date: contact.next_call_date ?? null,
    next_call_date_manual: contact.next_call_date_manual ?? false,
    calendar_event_id: contact.calendar_event_id ?? null,
    notes: contact.notes ?? null,
    updated_at: new Date().toISOString(),
  }
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadContacts = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from('contacts')
      .select(CONTACT_SELECT)
      .order('name', { ascending: true })

    if (!error) setContacts((data as Contact[]) ?? [])

    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  const createContact = useCallback(
    async (payload: ContactInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return { data: null, error: new Error('You must be signed in to create contacts.') }
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert(prepareForInsertOrUpdate(payload, user.id))
        .select(CONTACT_SELECT)
        .single()

      if (!error && data) setContacts((prev) => [data as Contact, ...prev])

      return { data, error }
    },
    [],
  )

  const importContactsCsv = useCallback(
    async (file: File): Promise<ImportResult> => {
      const result: ImportResult = {
        created: 0,
        updated: 0,
        skipped: 0,
        errors: [],
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        result.errors.push('You must be signed in to import contacts.')
        return result
      }

      const text = await file.text()
      const rows = parseCsv(text)
      const parsedContacts = rows
        .map(rowToContactInput)
        .filter((contact): contact is ContactInput => Boolean(contact))

      if (parsedContacts.length === 0) {
        result.errors.push('No valid contacts found in this CSV.')
        return result
      }

      const existingByEmail = new Map(
        contacts
          .filter((contact) => contact.email)
          .map((contact) => [contact.email!.toLowerCase(), contact]),
      )

      const toInsert: Array<ReturnType<typeof prepareForInsertOrUpdate>> = []
      const toUpdate: Array<{ id: string; payload: ReturnType<typeof prepareForInsertOrUpdate> }> = []
      const seenEmailsInFile = new Set<string>()

      for (const contact of parsedContacts) {
        const email = normalizeEmail(contact.email)

        if (email && seenEmailsInFile.has(email)) {
          result.skipped += 1
          continue
        }

        if (email) seenEmailsInFile.add(email)

        const payload = prepareForInsertOrUpdate(contact, user.id)

        if (email && existingByEmail.has(email)) {
          toUpdate.push({ id: existingByEmail.get(email)!.id, payload })
        } else {
          toInsert.push(payload)
        }
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('contacts').insert(toInsert)

        if (error) {
          result.errors.push(`Create failed: ${error.message}`)
        } else {
          result.created = toInsert.length
        }
      }

      if (toUpdate.length > 0) {
        const updateResponses = await Promise.all(
          toUpdate.map(({ id, payload }) =>
            supabase
              .from('contacts')
              .update(payload)
              .eq('id', id),
          ),
        )

        const failed = updateResponses.filter((response) => response.error)

        if (failed.length > 0) {
          result.errors.push(
            `Update failed for ${failed.length} contact${failed.length === 1 ? '' : 's'}.`,
          )
        }

        result.updated = toUpdate.length - failed.length
      }

      await loadContacts()

      return result
    },
    [contacts, loadContacts],
  )

  return useMemo(
    () => ({
      contacts,
      isLoading,
      loadContacts,
      createContact,
      importContactsCsv,
    }),
    [contacts, isLoading, loadContacts, createContact, importContactsCsv],
  )
}
