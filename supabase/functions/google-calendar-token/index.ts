import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type RequestBody =
  | {
      action: 'store_refresh_token'
      refreshToken?: string | null
      scope?: string | null
      tokenType?: string | null
    }
  | {
      action: 'get_access_token'
    }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  try {
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID') ?? ''
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') ?? ''

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: 'Missing Supabase Edge Function environment variables.' }, 500)
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    })

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()

    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const body = (await req.json().catch(() => null)) as RequestBody | null

    if (!body?.action) {
      return json({ error: 'Missing action.' }, 400)
    }

    if (body.action === 'store_refresh_token') {
      const refreshToken = body.refreshToken?.trim()

      if (!refreshToken) {
        return json({ error: 'No Google refresh token was provided.' }, 400)
      }

      const { error } = await adminClient
        .from('google_oauth_tokens')
        .upsert(
          {
            user_id: user.id,
            provider: 'google',
            refresh_token: refreshToken,
            scope: body.scope ?? null,
            token_type: body.tokenType ?? null,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          },
        )

      if (error) {
        return json({ error: error.message }, 500)
      }

      return json({ stored: true })
    }

    if (body.action === 'get_access_token') {
      if (!googleClientId || !googleClientSecret) {
        return json(
          {
            error:
              'Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET Edge Function secrets.',
          },
          500,
        )
      }

      const { data: tokenRow, error: tokenReadError } = await adminClient
        .from('google_oauth_tokens')
        .select('refresh_token')
        .eq('user_id', user.id)
        .maybeSingle()

      if (tokenReadError) {
        return json({ error: tokenReadError.message }, 500)
      }

      if (!tokenRow?.refresh_token) {
        return json(
          {
            error: 'No saved Google refresh token found. Reconnect Google Calendar in Settings.',
            reconnectRequired: true,
          },
          404,
        )
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      })

      const tokenData = (await tokenResponse.json().catch(() => null)) as
        | {
            access_token?: string
            expires_in?: number
            scope?: string
            token_type?: string
            error?: string
            error_description?: string
          }
        | null

      if (!tokenResponse.ok || !tokenData?.access_token) {
        return json(
          {
            error:
              tokenData?.error_description ||
              tokenData?.error ||
              'Google token refresh failed.',
            reconnectRequired: true,
          },
          tokenResponse.status || 500,
        )
      }

      const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null

      await adminClient
        .from('google_oauth_tokens')
        .update({
          scope: tokenData.scope ?? null,
          token_type: tokenData.token_type ?? null,
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      return json({
        accessToken: tokenData.access_token,
        expiresAt,
      })
    }

    return json({ error: 'Unsupported action.' }, 400)
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Unknown Google token error.',
      },
      500,
    )
  }
})
