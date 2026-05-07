import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type FathomTranscriptLine = {
  speaker?: { display_name?: string; matched_calendar_invitee_email?: string }
  text?: string
  timestamp?: string
}

type FathomMeeting = {
  title?: string | null
  meeting_title?: string | null
  recording_id?: number | string | null
  url?: string | null
  share_url?: string | null
  created_at?: string | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  recording_start_time?: string | null
  recording_end_time?: string | null
  transcript_language?: string | null
  transcript?: FathomTranscriptLine[] | null
  default_summary?: { markdown_formatted?: string | null } | null
  action_items?: unknown[] | null
  calendar_invitees?: unknown[] | null
  recorded_by?: unknown | null
  crm_matches?: unknown | null
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function transcriptToText(transcript: FathomTranscriptLine[] | null | undefined) {
  if (!Array.isArray(transcript)) return null
  return transcript
    .map((line) => {
      const speaker = line.speaker?.display_name || line.speaker?.matched_calendar_invitee_email || 'Speaker'
      const timestamp = line.timestamp ? `[${line.timestamp}] ` : ''
      return `${timestamp}${speaker}: ${line.text ?? ''}`.trim()
    })
    .filter(Boolean)
    .join('\n')
}

async function fetchTranscript(apiKey: string, recordingId: string | number) {
  const response = await fetch(`https://api.fathom.ai/external/v1/recordings/${recordingId}/transcript`, {
    headers: { 'X-Api-Key': apiKey },
  })

  if (!response.ok) return null
  const data = await response.json()
  return Array.isArray(data.transcript) ? data.transcript : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const fathomApiKey = Deno.env.get('FATHOM_API_KEY') ?? ''

    if (!serviceRoleKey) return json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY secret' }, 500)
    if (!fathomApiKey) return json({ error: 'Missing FATHOM_API_KEY secret' }, 500)

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Number(body?.limit ?? 20), 50)
    const cursor = typeof body?.cursor === 'string' ? body.cursor : undefined

    const params = new URLSearchParams({
      limit: String(limit),
      include_summary: 'true',
      include_action_items: 'true',
      include_transcript: 'true',
    })
    if (cursor) params.set('cursor', cursor)

    const response = await fetch(`https://api.fathom.ai/external/v1/meetings?${params.toString()}`, {
      headers: { 'X-Api-Key': fathomApiKey },
    })

    if (!response.ok) {
      const text = await response.text()
      return json({ error: `Fathom API error: ${response.status} ${text}` }, response.status)
    }

    const fathomData = await response.json()
    const meetings = Array.isArray(fathomData.items) ? (fathomData.items as FathomMeeting[]) : []
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const rows = await Promise.all(
      meetings
        .filter((meeting) => meeting.recording_id)
        .map(async (meeting) => {
          const transcript = meeting.transcript ?? (meeting.recording_id ? await fetchTranscript(fathomApiKey, meeting.recording_id) : null)
          return {
            user_id: user.id,
            recording_id: String(meeting.recording_id),
            title: meeting.title ?? null,
            meeting_title: meeting.meeting_title ?? null,
            url: meeting.url ?? null,
            share_url: meeting.share_url ?? null,
            fathom_created_at: meeting.created_at ?? null,
            scheduled_start_time: meeting.scheduled_start_time ?? null,
            scheduled_end_time: meeting.scheduled_end_time ?? null,
            recording_start_time: meeting.recording_start_time ?? null,
            recording_end_time: meeting.recording_end_time ?? null,
            transcript_language: meeting.transcript_language ?? null,
            transcript,
            transcript_text: transcriptToText(transcript),
            summary_markdown: meeting.default_summary?.markdown_formatted ?? null,
            action_items: meeting.action_items ?? [],
            calendar_invitees: meeting.calendar_invitees ?? [],
            recorded_by: meeting.recorded_by ?? null,
            crm_matches: meeting.crm_matches ?? null,
            raw_payload: meeting,
            updated_at: new Date().toISOString(),
          }
        }),
    )

    if (rows.length > 0) {
      const { error: upsertError } = await adminClient
        .from('fathom_meetings')
        .upsert(rows, { onConflict: 'user_id,recording_id' })
      if (upsertError) throw upsertError
    }

    return json({ imported: rows.length, next_cursor: fathomData.next_cursor ?? null })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
