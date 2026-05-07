import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Contact = {
  id: string
  name: string
  role: string | null
  company: string | null
  email: string | null
  stage: string | null
  starred: boolean
  color: string | null
  next_call_date: string | null
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadContacts = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('id,name,role,company,email,stage,starred,color,next_call_date')
      .order('name', { ascending: true })
    if (!error) setContacts((data as Contact[]) ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadContacts()
  }, [loadContacts])

  const createContact = useCallback(async (payload: Partial<Contact> & { name: string }) => {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        name: payload.name,
        role: payload.role ?? null,
        company: payload.company ?? null,
        email: payload.email ?? null,
        stage: payload.stage ?? 'prospect',
        starred: payload.starred ?? false,
        color: payload.color ?? '#8ba5a8',
      })
      .select('id,name,role,company,email,stage,starred,color,next_call_date')
      .single()
    if (!error && data) setContacts((prev) => [data as Contact, ...prev])
    return { data, error }
  }, [])

  return useMemo(() => ({ contacts, isLoading, loadContacts, createContact }), [contacts, isLoading, loadContacts, createContact])
}
