import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type NurtureContact = {
  id: string
  name: string
  email: string | null
  color: string | null
  next_nurture_date: string | null
  nurture_frequency_days: number | null
  next_call_date: string | null
}

function toDateOnly(value: string) {
  return value.slice(0, 10)
}

function plusDays(dateISO: string, days: number) {
  const date = new Date(dateISO)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function useNurture() {
  const [contacts, setContacts] = useState<NurtureContact[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNurture = useCallback(async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('id,name,email,color,next_nurture_date,nurture_frequency_days,next_call_date')
      .not('nurture_frequency_days', 'is', null)
      .order('next_nurture_date', { ascending: true })
    if (!error) setContacts((data as NurtureContact[]) ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadNurture()
  }, [loadNurture])

  const markDone = useCallback(async (contact: NurtureContact) => {
    const frequency = contact.nurture_frequency_days ?? 14
    const base = contact.next_nurture_date ?? new Date().toISOString()
    const next = plusDays(base, frequency)

    const { error: touchError } = await supabase.from('nurture_touches').insert({
      contact_id: contact.id,
      touch_date: toDateOnly(new Date().toISOString()),
      status: 'sent',
    })
    if (touchError) return { error: touchError }

    const { error } = await supabase
      .from('contacts')
      .update({ next_nurture_date: next, updated_at: new Date().toISOString() })
      .eq('id', contact.id)

    if (!error) {
      setContacts((prev) =>
        prev.map((item) =>
          item.id === contact.id ? { ...item, next_nurture_date: next } : item,
        ),
      )
    }
    return { error }
  }, [])

  return useMemo(() => ({ contacts, isLoading, loadNurture, markDone }), [contacts, isLoading, loadNurture, markDone])
}
