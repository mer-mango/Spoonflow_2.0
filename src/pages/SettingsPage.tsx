import { useCallback, useEffect, useMemo, useState } from 'react'import { supabase } from '../lib/supabase'

type SettingsSection =| 'profile'| 'integrations'| 'notifications'| 'jamie'| 'data'

type FathomMeeting = {id?: stringtitle?: string | nullmeeting_title?: string | nullname?: string | nullstarted_at?: string | nullstart_time?: string | nullcreated_at?: string | nullimported_at?: string | nullfathom_url?: string | nullurl?: string | nullsummary?: string | null}

const GOOGLE_PROVIDER_TOKEN_KEY = 'spoonflow_google_provider_token'const FATHOM_SETTINGS_KEY = 'spoonflow_fathom_settings'

function getInitialSection(): SettingsSection {const path = window.location.pathname

if (path.includes('/settings/integrations')) return 'integrations'

return 'integrations'}

function getFathomWebhookUrl() {const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined

if (!supabaseUrl) return 'Supabase URL missing'

return ${supabaseUrl.replace(/\/$/, '')}/functions/v1/fathom-webhook}

function formatDate(value?: string | null) {if (!value) return 'No date'

try {return new Date(value).toLocaleString([], {month: 'short',day: 'numeric',hour: 'numeric',minute: '2-digit',})} catch {return value}}

function getMeetingTitle(meeting: FathomMeeting) {return (meeting.title ||meeting.meeting_title ||meeting.name ||'Untitled Fathom meeting')}

function getMeetingDate(meeting: FathomMeeting) {return (meeting.started_at ||meeting.start_time ||meeting.created_at ||meeting.imported_at ||null)}

function getMeetingUrl(meeting: FathomMeeting) {return meeting.fathom_url || meeting.url || null}

export function SettingsPage() {const [activeSection, setActiveSection] = useState(() => getInitialSection())const [statusMessage, setStatusMessage] = useState<string | null>(null)const [googleConnected, setGoogleConnected] = useState(false)const [fathomEnabled, setFathomEnabled] = useState(false)const [fathomWorkspaceUrl, setFathomWorkspaceUrl] = useState('')const [fathomMeetings, setFathomMeetings] = useState<FathomMeeting[]>([])const [isSyncingFathom, setIsSyncingFathom] = useState(false)const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)

const webhookUrl = useMemo(() => getFathomWebhookUrl(), [])

const loadFathomMeetings = useCallback(async () => {setIsLoadingMeetings(true)

try {
  const { data, error } = await supabase
    .from('fathom_meetings')
    .select('*')
    .order('imported_at', { ascending: false })
    .limit(10)

  if (error) {
    setStatusMessage(error.message)
    return
  }

  setFathomMeetings((data ?? []) as FathomMeeting[])
} finally {
  setIsLoadingMeetings(false)
}

}, [])

useEffect(() => {const saved = localStorage.getItem(FATHOM_SETTINGS_KEY)

if (saved) {
  try {
    const parsed = JSON.parse(saved) as {
      enabled?: boolean
      workspaceUrl?: string
    }

    setFathomEnabled(Boolean(parsed.enabled))
    setFathomWorkspaceUrl(parsed.workspaceUrl ?? '')
  } catch {
    // Ignore malformed local settings.
  }
}

const hydrateGoogleStatus = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.provider_token) {
    localStorage.setItem(GOOGLE_PROVIDER_TOKEN_KEY, session.provider_token)
  }

  setGoogleConnected(Boolean(session || localStorage.getItem(GOOGLE_PROVIDER_TOKEN_KEY)))
}

void hydrateGoogleStatus()
void loadFathomMeetings()

}, [loadFathomMeetings])

const connectGoogleCalendar = async () => {setStatusMessage(null)localStorage.removeItem(GOOGLE_PROVIDER_TOKEN_KEY)

const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/settings/integrations`,
    scopes: 'https://www.googleapis.com/auth/calendar.readonly email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})

if (error) {
  setStatusMessage(error.message)
}

}

const saveFathomSetup = () => {localStorage.setItem(FATHOM_SETTINGS_KEY,JSON.stringify({enabled: fathomEnabled,workspaceUrl: fathomWorkspaceUrl,}),)

setStatusMessage(
  'Fathom settings saved for this browser. Add the API key and webhook secret in Supabase for automatic imports.',
)

}

const syncFathomMeetings = async () => {setStatusMessage(null)setIsSyncingFathom(true)

try {
  const { data, error } = await supabase.functions.invoke('fathom-sync', {
    body: { limit: 10 },
  })

  if (error) {
    setStatusMessage(error.message || 'Edge Function returned a non-2xx status code')
    return
  }

  const importedCount =
    typeof data?.imported === 'number'
      ? data.imported
      : typeof data?.count === 'number'
        ? data.count
        : typeof data?.meetings?.length === 'number'
          ? data.meetings.length
          : null

  setStatusMessage(
    importedCount === null
      ? 'Fathom sync complete.'
      : `Fathom sync complete. Imported ${importedCount} meetings.`,
  )

  await loadFathomMeetings()
} catch (error) {
  setStatusMessage(error instanceof Error ? error.message : 'Unknown Fathom sync error')
} finally {
  setIsSyncingFathom(false)
}

}

const sections: Array<{id: SettingsSectionlabel: stringgroup: 'Workspace' | 'Preferences' | 'Admin'}> = [{ id: 'profile', label: 'Profile', group: 'Workspace' },{ id: 'integrations', label: 'Integrations', group: 'Workspace' },{ id: 'notifications', label: 'Notifications', group: 'Preferences' },{ id: 'jamie', label: 'Jamie', group: 'Preferences' },{ id: 'data', label: 'Data & Privacy', group: 'Admin' },]

const groupedSections = sections.reduce((acc, item) => {acc[item.group] = [...(acc[item.group] ?? []), item]return acc},{} as Record<string, typeof sections>,)

return (SettingsManage integrations, preferences, Jamie, and workspace details.

  <div className="grid min-h-[620px] grid-cols-1 md:grid-cols-[220px_1fr]">
    <aside className="border-b border-[var(--border)] bg-white p-4 md:border-b-0 md:border-r">
      {Object.entries(groupedSections).map(([group, items]) => (
        <div key={group} className="mb-5">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
            {group}
          </p>

          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id)

                  if (item.id === 'integrations') {
                    window.history.replaceState(null, '', '/settings/integrations')
                  } else {
                    window.history.replaceState(null, '', '/settings')
                  }
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  activeSection === item.id
                    ? 'bg-[#f5f1f4] font-medium text-[var(--jamie)]'
                    : 'text-[var(--text)] hover:bg-black/[0.04]'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-current opacity-40" />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>

    <main className="bg-[var(--bg)] p-5 md:p-8">
      {statusMessage && (
        <div className="mb-5 rounded-xl border border-[rgba(107,35,88,0.18)] bg-[rgba(107,35,88,0.06)] px-4 py-3 text-sm text-[var(--jamie)]">
          {statusMessage}
        </div>
      )}

      {activeSection === 'integrations' && (
        <div>
          <h2 className="text-2xl">Integrations</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Connect the systems that power SpoonFlow&apos;s planning, meeting prep, and follow-up workflows.
          </p>

          <div className="mt-6 space-y-4">
            <article className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--meeting)] text-sm font-semibold text-white">
                    G
                  </div>

                  <div>
                    <h3 className="font-semibold">Google Calendar</h3>
                    <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                      Authorize SpoonFlow to read your Google Calendar so Today and Calendar can pull in meetings,
                      medical appointments, and prep blocks.
                    </p>

                    <div className="mt-4 rounded-lg bg-[#f3f1ef] px-3 py-3 text-xs text-[var(--muted)]">
                      Vercel URL to add in Supabase redirect settings:{' '}
                      <span className="font-semibold text-[var(--text)]">
                        {window.location.origin}/settings/integrations
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {googleConnected && (
                    <span className="rounded-lg bg-[#e8f2ea] px-3 py-2 text-xs font-medium text-[#4f7457]">
                      Connected
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={connectGoogleCalendar}
                    className="rounded-lg bg-[var(--jamie)] px-3 py-2 text-xs font-semibold text-white"
                  >
                    {googleConnected ? 'Reconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--nurture)] text-sm font-semibold text-white">
                    S
                  </div>

                  <div>
                    <h3 className="font-semibold">Supabase</h3>
                    <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                      Stores contacts, tasks, content items, goals, Jamie conversations, app settings, and imported
                      Fathom meeting transcripts.
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-lg bg-[#e8f2ea] px-3 py-2 text-xs font-medium text-[#4f7457]">
                  Connected
                </span>
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--jamie)] text-sm font-semibold text-white">
                    A
                  </div>

                  <div>
                    <h3 className="font-semibold">Anthropic Claude</h3>
                    <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                      Powers Jamie through the Supabase Edge Function proxy. Configure this with
                      ANTHROPIC_API_KEY in Supabase, not in the Vercel frontend.
                    </p>
                  </div>
                </div>

                <span className="w-fit rounded-lg bg-[#f3f1ef] px-3 py-2 text-xs font-medium text-[var(--muted)]">
                  Backend needed
                </span>
              </div>
            </article>

            <article className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c198ad] text-sm font-semibold text-white">
                    F
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">Fathom</h3>
                    <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
                      Import meeting transcripts, summaries, and action items into SpoonFlow through a Supabase
                      Edge Function and optional Fathom webhook.
                    </p>

                    <div className="mt-5 rounded-xl border border-[var(--border)] bg-white p-4">
                      <label className="flex items-center justify-between gap-4 text-sm font-medium">
                        <span>Enable Fathom imports</span>
                        <input
                          type="checkbox"
                          checked={fathomEnabled}
                          onChange={(event) => setFathomEnabled(event.target.checked)}
                          className="h-4 w-4"
                        />
                      </label>

                      <label className="mt-4 block text-xs font-medium text-[var(--muted)]">
                        Fathom workspace or login URL
                      </label>

                      <input
                        value={fathomWorkspaceUrl}
                        onChange={(event) => setFathomWorkspaceUrl(event.target.value)}
                        placeholder="https://fathom.video/home"
                        className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--jamie)]"
                      />

                      <div className="mt-4 rounded-lg bg-[#f3f1ef] px-3 py-3 text-xs text-[var(--muted)]">
                        Webhook destination URL:{' '}
                        <span className="font-semibold text-[var(--text)]">{webhookUrl}</span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={saveFathomSetup}
                          className="rounded-lg bg-[var(--jamie)] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Save Fathom setup
                        </button>

                        <button
                          type="button"
                          onClick={syncFathomMeetings}
                          disabled={isSyncingFathom}
                          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] disabled:opacity-50"
                        >
                          {isSyncingFathom ? 'Syncing...' : 'Sync recent meetings'}
                        </button>

                        <button
                          type="button"
                          onClick={loadFathomMeetings}
                          disabled={isLoadingMeetings}
                          className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] disabled:opacity-50"
                        >
                          {isLoadingMeetings ? 'Refreshing...' : 'Refresh list'}
                        </button>
                      </div>

                      <div className="mt-5">
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          Recently imported
                        </p>

                        {fathomMeetings.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
                            No imported Fathom meetings yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {fathomMeetings.map((meeting, index) => {
                              const url = getMeetingUrl(meeting)

                              return (
                                <div
                                  key={meeting.id ?? `${getMeetingTitle(meeting)}-${index}`}
                                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-3"
                                >
                                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                    <div>
                                      <p className="text-sm font-semibold text-[var(--text)]">
                                        {getMeetingTitle(meeting)}
                                      </p>

                                      <p className="mt-1 text-xs text-[var(--muted)]">
                                        {formatDate(getMeetingDate(meeting))}
                                      </p>
                                    </div>

                                    {url && (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-semibold text-[var(--jamie)]"
                                      >
                                        Open in Fathom
                                      </a>
                                    )}
                                  </div>

                                  {meeting.summary && (
                                    <p className="mt-2 line-clamp-2 text-xs text-[var(--muted)]">
                                      {meeting.summary}
                                    </p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {activeSection !== 'integrations' && (
        <div>
          <h2 className="text-2xl">
            {sections.find((section) => section.id === activeSection)?.label}
          </h2>

          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
            Settings for this section will live here.
          </p>
        </div>
      )}
    </main>
  </div>
</section>

)}
