import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type NurtureContact = {
  id: string
  name: string
  email: string | null
  linkedin_url: string | null
  color: string | null
  next_nurture_date: string | null
  nurture_frequency_days: number | null
  next_call_date: string | null
  notes?: string | null
  about?: string | null
}

export type NurtureUpdateInput = {
  nurture_frequency_days: number | null
  next_nurture_date: string | null
}

function plusDaysFromToday(days: number) {
  const date = new Date()
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
      .select(
        'id,name,email,linkedin_url,color,next_nurture_date,nurture_frequency_days,next_call_date,notes,about',
      )
      .not('nurture_frequency_days', 'is', null)
      .order('next_nurture_date', { ascending: true })

    if (!error) {
      setContacts((data as NurtureContact[]) ?? [])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    void loadNurture()
  }, [loadNurture])

  const updateNurture = useCallback(
    async (contactId: string, patch: NurtureUpdateInput) => {
      const { error } = await supabase
        .from('contacts')
        .update({
          nurture_frequency_days: patch.nurture_frequency_days,
          next_nurture_date: patch.next_nurture_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId)

      if (!error) {
        setContacts((prev) =>
          prev.map((contact) =>
            contact.id === contactId
              ? {
                  ...contact,
                  nurture_frequency_days: patch.nurture_frequency_days,
                  next_nurture_date: patch.next_nurture_date,
                }
              : contact,
          ),
        )
      }

      return { error }
    },
    [],
  )

  const advanceNurtureFromToday = useCallback(
    async (contact: NurtureContact) => {
      const frequency = contact.nurture_frequency_days ?? 14
      const next = plusDaysFromToday(frequency)

      return updateNurture(contact.id, {
        nurture_frequency_days: frequency,
        next_nurture_date: next,
      })
    },
    [updateNurture],
  )

  return useMemo(
    () => ({
      contacts,
      isLoading,
      loadNurture,
      updateNurture,
      advanceNurtureFromToday,
    }),
    [contacts, isLoading, loadNurture, updateNurture, advanceNurtureFromToday],
  )
}
