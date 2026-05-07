import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type FathomTranscriptLine = {
  speaker?: { display_name?: string; matched_calendar_invitee_email?: string }
  text?: string
  timestamp?: string
}

type FathomWebhookPayload = {
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

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

function bytesToBase64(bytes: ArrayBuffer) {
  const array = new Uint8Array(bytes)
  let binary = ''
  for (const byte of array) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

async function verifyFathomWebhook(req: Request, rawBody: string, secret: string) {
  const webhookId = req.headers.get('webhook-id')
  const webhookTimestamp = req.headers.get('webhook-timestamp')
  const webhookSignature = req.headers.get('webhook-signature')

  if (!webhookId || !webhookTimestamp || !webhookSignature) return false

  const timestamp = Number(webhookTimestamp)
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > 300) return false

  const encodedSecret = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret
  const secretBytes = base64ToBytes(encodedSecret)
  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedContent))
  const expected = bytesToBase64(signatureBuffer)
  const provided = webhookSignature.split(' ').map((sig) => (sig.includes(',') ? sig.split(',')[1] : sig))

  return provided.some((sig) => safeEqual(expected, sig))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const rawBody = await req.text()
    const webhookSecret = Deno.env.get('FATHOM_WEBHOOK_SECRET')
    if (webhookSecret) {
      const verified = await verifyFathomWebhook(req, rawBody, webhookSecret)
      if (!verified) return json({ error: 'Invalid Fathom webhook signature' }, 401)
    }

    const payload = JSON.parse(rawBody) as FathomWebhookPayload
    if (!payload.recording_id) return json({ error: 'Missing recording_id' }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const defaultUserId = Deno.env.get('FATHOM_DEFAULT_USER_ID') ?? ''

    if (!serviceRoleKey) return json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY secret' }, 500)
    if (!defaultUserId) return json({ error: 'Missing FATHOM_DEFAULT_USER_ID secret' }, 500)

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const transcript = payload.transcript ?? null

    const { error } = await adminClient.from('fathom_meetings').upsert(
      {
        user_id: defaultUserId,
        recording_id: String(payload.recording_id),
        title: payload.title ?? null,
        meeting_title: payload.meeting_title ?? null,
        url: payload.url ?? null,
        share_url: payload.share_url ?? null,
        fathom_created_at: payload.created_at ?? null,
        scheduled_start_time: payload.scheduled_start_time ?? null,
        scheduled_end_time: payload.scheduled_end_time ?? null,
        recording_start_time: payload.recording_start_time ?? null,
        recording_end_time: payload.recording_end_time ?? null,
        transcript_language: payload.transcript_language ?? null,
        transcript,
        transcript_text: transcriptToText(transcript),
        summary_markdown: payload.default_summary?.markdown_formatted ?? null,
        action_items: payload.action_items ?? [],
        calendar_invitees: payload.calendar_invitees ?? [],
        recorded_by: payload.recorded_by ?? null,
        crm_matches: payload.crm_matches ?? null,
        raw_payload: payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,recording_id' },
    )

    if (error) throw error
    return json({ ok: true })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
