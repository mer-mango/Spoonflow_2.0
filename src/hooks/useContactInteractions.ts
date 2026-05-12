import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export type ContactInteraction = {
  id: string
  user_id?: string
  contact_id: string
  interaction_type: string
  title: string
  interaction_date: string | null
  start_time: string | null
  end_time: string | null
  source: string
  calendar_event_id: string | null
  prep_notes: string | null
  during_meeting_notes: string | null
  fathom_url: string | null
  post_meeting_summary: string | null
  full_transcript: string | null
  follow_up_meeting_needed: boolean | null
  thank_you_email_notes: string | null
  archived: boolean
  created_at?: string
  updated_at?: string
}

export type InteractionActionItem = {
  id: string
  user_id?: string
  interaction_id: string
  text: string
  task_id: string | null
  archived: boolean
  created_at?: string
  updated_at?: string
}

export type ContactInteractionInput = Partial<ContactInteraction> & {
  contact_id: string
  title?: string
}

export type ContactInteractionUpdateInput = Partial<
  Pick<
    ContactInteraction,
    | 'title'
    | 'interaction_type'
    | 'interaction_date'
    | 'start_time'
    | 'end_time'
    | 'source'
    | 'calendar_event_id'
    | 'prep_notes'
    | 'during_meeting_notes'
    | 'fathom_url'
    | 'post_meeting_summary'
    | 'full_transcript'
    | 'follow_up_meeting_needed'
    | 'thank_you_email_notes'
    | 'archived'
  >
>

export type InteractionActionItemInput = {
  interaction_id: string
  text: string
}

export type InteractionActionItemUpdateInput = Partial<
  Pick<InteractionActionItem, 'text' | 'task_id' | 'archived'>
>

const INTERACTION_SELECT = `
  id,
  user_id,
  contact_id,
  interaction_type,
  title,
  interaction_date,
  start_time,
  end_time,
  source,
  calendar_event_id,
  prep_notes,
  during_meeting_notes,
  fathom_url,
  post_meeting_summary,
  full_transcript,
  follow_up_meeting_needed,
  thank_you_email_notes,
  archived,
  created_at,
  updated_at
`

const ACTION_ITEM_SELECT = `
  id,
  user_id,
  interaction_id,
  text,
  task_id,
  archived,
  created_at,
  updated_at
`

function cleanText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function prepareInteractionInsert(
  payload: ContactInteractionInput,
  userId: string,
) {
  return {
    user_id: userId,
    contact_id: payload.contact_id,
    interaction_type: payload.interaction_type ?? 'meeting',
    title: cleanText(payload.title) ?? 'Untitled meeting',
    interaction_date: payload.interaction_date ?? null,
    start_time: payload.start_time ?? null,
    end_time: payload.end_time ?? null,
    source: payload.source ?? 'manual',
    calendar_event_id: payload.calendar_event_id ?? null,
    prep_notes: cleanText(payload.prep_notes),
    during_meeting_notes: cleanText(payload.during_meeting_notes),
    fathom_url: cleanText(payload.fathom_url),
    post_meeting_summary: cleanText(payload.post_meeting_summary),
    full_transcript: cleanText(payload.full_transcript),
    follow_up_meeting_needed: payload.follow_up_meeting_needed ?? null,
    thank_you_email_notes: cleanText(payload.thank_you_email_notes),
    archived: payload.archived ?? false,
    updated_at: new Date().toISOString(),
  }
}

function prepareInteractionUpdate(payload: ContactInteractionUpdateInput) {
  const update: Record<string, string | boolean | null> = {
    updated_at: new Date().toISOString(),
  }

  if ('title' in payload) update.title = cleanText(payload.title) ?? 'Untitled meeting'
  if ('interaction_type' in payload) {
    update.interaction_type = payload.interaction_type ?? 'meeting'
  }
  if ('interaction_date' in payload) update.interaction_date = payload.interaction_date ?? null
  if ('start_time' in payload) update.start_time = payload.start_time ?? null
  if ('end_time' in payload) update.end_time = payload.end_time ?? null
  if ('source' in payload) update.source = payload.source ?? 'manual'
  if ('calendar_event_id' in payload) {
    update.calendar_event_id = payload.calendar_event_id ?? null
  }
  if ('prep_notes' in payload) update.prep_notes = cleanText(payload.prep_notes)
  if ('during_meeting_notes' in payload) {
    update.during_meeting_notes = cleanText(payload.during_meeting_notes)
  }
  if ('fathom_url' in payload) update.fathom_url = cleanText(payload.fathom_url)
  if ('post_meeting_summary' in payload) {
    update.post_meeting_summary = cleanText(payload.post_meeting_summary)
  }
  if ('full_transcript' in payload) update.full_transcript = cleanText(payload.full_transcript)
  if ('follow_up_meeting_needed' in payload) {
    update.follow_up_meeting_needed = payload.follow_up_meeting_needed ?? null
  }
  if ('thank_you_email_notes' in payload) {
    update.thank_you_email_notes = cleanText(payload.thank_you_email_notes)
  }
  if ('archived' in payload) update.archived = Boolean(payload.archived)

  return update
}

function prepareActionItemUpdate(payload: InteractionActionItemUpdateInput) {
  const update: Record<string, string | boolean | null> = {
    updated_at: new Date().toISOString(),
  }

  if ('text' in payload) update.text = cleanText(payload.text) ?? 'Untitled action item'
  if ('task_id' in payload) update.task_id = payload.task_id ?? null
  if ('archived' in payload) update.archived = Boolean(payload.archived)

  return update
}

export function useContactInteractions(contactId?: string | null) {
  const [interactions, setInteractions] = useState<ContactInteraction[]>([])
  const [actionItems, setActionItems] = useState<InteractionActionItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadInteractions = useCallback(async () => {
    if (!contactId) {
      setInteractions([])
      setActionItems([])
      return
    }

    setIsLoading(true)

    const { data: interactionData, error: interactionError } = await supabase
      .from('contact_interactions')
      .select(INTERACTION_SELECT)
      .eq('contact_id', contactId)
      .eq('archived', false)
      .order('interaction_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (!interactionError) {
      const nextInteractions = (interactionData as ContactInteraction[]) ?? []
      setInteractions(nextInteractions)

      const interactionIds = nextInteractions.map((interaction) => interaction.id)

      if (interactionIds.length === 0) {
        setActionItems([])
      } else {
        const { data: actionItemData, error: actionItemError } = await supabase
          .from('interaction_action_items')
          .select(ACTION_ITEM_SELECT)
          .in('interaction_id', interactionIds)
          .eq('archived', false)
          .order('created_at', { ascending: true })

        if (!actionItemError) {
          setActionItems((actionItemData as InteractionActionItem[]) ?? [])
        }
      }
    }

    setIsLoading(false)
  }, [contactId])

  useEffect(() => {
    void loadInteractions()
  }, [loadInteractions])

  const createInteraction = useCallback(
    async (payload: ContactInteractionInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return {
          data: null,
          error: new Error('You must be signed in to create an interaction.'),
        }
      }

      const { data, error } = await supabase
        .from('contact_interactions')
        .insert(prepareInteractionInsert(payload, user.id))
        .select(INTERACTION_SELECT)
        .single()

      if (!error && data) {
        setInteractions((prev) => [data as ContactInteraction, ...prev])
      }

      return { data, error }
    },
    [],
  )

  const updateInteraction = useCallback(
    async (interactionId: string, patch: ContactInteractionUpdateInput) => {
      const { data, error } = await supabase
        .from('contact_interactions')
        .update(prepareInteractionUpdate(patch))
        .eq('id', interactionId)
        .select(INTERACTION_SELECT)
        .single()

      if (!error && data) {
        setInteractions((prev) =>
          prev.map((interaction) =>
            interaction.id === interactionId ? (data as ContactInteraction) : interaction,
          ),
        )
      }

      return { data, error }
    },
    [],
  )

  const archiveInteraction = useCallback(
    async (interactionId: string) => {
      const { data, error } = await supabase
        .from('contact_interactions')
        .update({
          archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', interactionId)
        .select(INTERACTION_SELECT)
        .single()

      if (!error && data) {
        setInteractions((prev) =>
          prev.filter((interaction) => interaction.id !== interactionId),
        )
        setActionItems((prev) =>
          prev.filter((item) => item.interaction_id !== interactionId),
        )
      }

      return { data, error }
    },
    [],
  )

  const createActionItem = useCallback(
    async (payload: InteractionActionItemInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return {
          data: null,
          error: new Error('You must be signed in to create an action item.'),
        }
      }

      const text = cleanText(payload.text)

      if (!text) {
        return {
          data: null,
          error: new Error('Action item text is required.'),
        }
      }

      const { data, error } = await supabase
        .from('interaction_action_items')
        .insert({
          user_id: user.id,
          interaction_id: payload.interaction_id,
          text,
          task_id: null,
          archived: false,
          updated_at: new Date().toISOString(),
        })
        .select(ACTION_ITEM_SELECT)
        .single()

      if (!error && data) {
        setActionItems((prev) => [...prev, data as InteractionActionItem])
      }

      return { data, error }
    },
    [],
  )

  const updateActionItem = useCallback(
    async (actionItemId: string, patch: InteractionActionItemUpdateInput) => {
      const { data, error } = await supabase
        .from('interaction_action_items')
        .update(prepareActionItemUpdate(patch))
        .eq('id', actionItemId)
        .select(ACTION_ITEM_SELECT)
        .single()

      if (!error && data) {
        setActionItems((prev) =>
          prev.map((item) =>
            item.id === actionItemId ? (data as InteractionActionItem) : item,
          ),
        )
      }

      return { data, error }
    },
    [],
  )

  const archiveActionItem = useCallback(
    async (actionItemId: string) => {
      const { data, error } = await supabase
        .from('interaction_action_items')
        .update({
          archived: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', actionItemId)
        .select(ACTION_ITEM_SELECT)
        .single()

      if (!error && data) {
        setActionItems((prev) => prev.filter((item) => item.id !== actionItemId))
      }

      return { data, error }
    },
    [],
  )

  const actionItemsForInteraction = useCallback(
    (interactionId: string) =>
      actionItems.filter((item) => item.interaction_id === interactionId && !item.archived),
    [actionItems],
  )

  return useMemo(
    () => ({
      interactions,
      actionItems,
      isLoading,
      loadInteractions,
      createInteraction,
      updateInteraction,
      archiveInteraction,
      createActionItem,
      updateActionItem,
      archiveActionItem,
      actionItemsForInteraction,
    }),
    [
      interactions,
      actionItems,
      isLoading,
      loadInteractions,
      createInteraction,
      updateInteraction,
      archiveInteraction,
      createActionItem,
      updateActionItem,
      archiveActionItem,
      actionItemsForInteraction,
    ],
  )
}
