import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTasks, type Task } from '../hooks/useTasks'

type SettingsSection =
  | 'integrations'
  | 'notifications'
  | 'jamie'
  | 'archive'
  | 'data'

type FathomMeeting = {
  id?: string
  title?: string | null
  meeting_title?: string | null
  name?: string | null
  started_at?: string | null
  start_time?: string | null
  created_at?: string | null
  imported_at?: string | null
  fathom_url?: string | null
  url?: string | null
  summary?: string | null
}

const GOOGLE_PROVIDER_TOKEN_KEY = 'spoonflow_google_provider_token'
const FATHOM_SETTINGS_KEY = 'spoonflow_fathom_settings'

function getInitialSection(): SettingsSection {
  const path = window.location.pathname

  if (path.includes('/settings/integrations')) return 'integrations'
  if (path.includes('/settings/archive')) return 'archive'

  return 'integrations'
}

function getFathomWebhookUrl() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined

  if (!supabaseUrl) return 'Supabase URL missing'

  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/fathom-webhook`
}

function formatDate(value?: string | null) {
  if (!value) return 'No date'

  try {
    return new Date(value).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function getMeetingTitle(meeting: FathomMeeting) {
  return (
    meeting.title ||
    meeting.meeting_title ||
    meeting.name ||
    'Untitled Fathom meeting'
  )
}
function getMeetingDate(meeting: FathomMeeting) {
  return (
    meeting.started_at ||
    meeting.start_time ||
    meeting.created_at ||
    meeting.imported_at ||
    null
  )
}
function getMeetingUrl(meeting: FathomMeeting) {
  return meeting.fathom_url || meeting.url || null
}
function formatShortDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function statusLabel(status: Task['status']) {
  if (status === 'toDo') return 'To Do'
  if (status === 'inProgress') return 'In Progress'
  if (status === 'awaitingReply') return 'Awaiting Reply'
  return 'Done'
}

const taskTypeLabels: Record<string, string> = {
  admin: 'Admin',
  outreach: 'Outreach',
  client_work: 'Client Work',
  business_development: 'Business Development',
  schedule: 'Schedule',
  other: 'Other',
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>(() => getInitialSection())
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [fathomEnabled, setFathomEnabled] = useState(false)
  const [fathomWorkspaceUrl, setFathomWorkspaceUrl] = useState('')
  const [fathomMeetings, setFathomMeetings] = useState<FathomMeeting[]>([])
  const [isSyncingFathom, setIsSyncingFathom] = useState(false)
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)
  const {
  archivedTasks,
  loadArchivedTasks,
  restoreTask,
  deleteTask,
} = useTasks()

  const webhookUrl = useMemo(() => getFathomWebhookUrl(), [])

  const loadFathomMeetings = useCallback(async () => {
    setIsLoadingMeetings(true)

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

  useEffect(() => {
    const saved = localStorage.getItem(FATHOM_SETTINGS_KEY)

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
    
      if (session?.provider_refresh_token) {
        const { error } = await supabase.functions.invoke('google-calendar-token', {
          body: {
            action: 'store_refresh_token',
            refreshToken: session.provider_refresh_token,
          },
        })
    
        if (error) {
          console.warn('Google refresh token could not be stored:', error.message)
        }
      }
    
      setGoogleConnected(Boolean(session || localStorage.getItem(GOOGLE_PROVIDER_TOKEN_KEY)))
}

    void hydrateGoogleStatus()
    void loadFathomMeetings()
  }, [loadFathomMeetings])
  
  useEffect(() => {
    if (activeSection === 'archive') {
      void loadArchivedTasks()
    }
  }, [activeSection, loadArchivedTasks])

  const connectGoogleCalendar = async () => {
    setStatusMessage(null)
    localStorage.removeItem(GOOGLE_PROVIDER_TOKEN_KEY)

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

  const saveFathomSetup = () => {
    localStorage.setItem(
      FATHOM_SETTINGS_KEY,
      JSON.stringify({
        enabled: fathomEnabled,
        workspaceUrl: fathomWorkspaceUrl,
      }),
    )

    setStatusMessage(
      'Fathom settings saved for this browser. Add the API key and webhook secret in Supabase for automatic imports.',
    )
  }

  const syncFathomMeetings = async () => {
    setStatusMessage(null)
    setIsSyncingFathom(true)

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
const handleRestoreTask = async (task: Task) => {
  const { error } = await restoreTask(task.id)

  if (error) {
    setStatusMessage(`Task restore failed: ${error.message}`)
    return
  }

  setStatusMessage('Task restored.')
  await loadArchivedTasks()
}

const handleDeleteTask = async (task: Task) => {
  const shouldDelete = window.confirm(
    `Permanently delete "${task.title}"? This cannot be undone.`,
  )

  if (!shouldDelete) return

  const { error } = await deleteTask(task.id)

  if (error) {
    setStatusMessage(`Task delete failed: ${error.message}`)
    return
  }

  setStatusMessage('Task permanently deleted.')
  await loadArchivedTasks()
}
  
    const sections: Array<{
    id: SettingsSection
    label: string
    group: 'Workspace' | 'Preferences' | 'Admin'
  }> = [
    { id: 'integrations', label: 'Integrations', group: 'Workspace' },
    { id: 'notifications', label: 'Notifications', group: 'Preferences' },
    { id: 'jamie', label: 'Jamie', group: 'Preferences' },
    { id: 'archive', label: 'Archive', group: 'Admin' },
    { id: 'data', label: 'Data & Privacy', group: 'Admin' },
  ]

  const groupedSections = sections.reduce(
    (acc, item) => {
      acc[item.group] = [...(acc[item.group] ?? []), item]
      return acc
    },
    {} as Record<string, typeof sections>,
  )

  return (
    <section className="mx-auto max-w-6xl rounded-2xl border border-[var(--border)] bg-white">
      <header className="border-b border-[var(--border)] px-6 py-5">
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage integrations, preferences, Jamie, and workspace details.
        </p>
      </header>

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
                      } else if (item.id === 'archive') {
                        window.history.replaceState(null, '', '/settings/archive')
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

          {activeSection === 'archive' && (
  <div>
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-2xl">Archive</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          Review archived items and restore anything you want back in your workspace.
          For now, this section supports archived tasks.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void loadArchivedTasks()}
        className="w-fit rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)]"
      >
        Refresh
      </button>
    </div>

    <div className="mt-6 rounded-xl border border-[var(--border)] bg-white">
      <header className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <h3 className="font-semibold">Archived Tasks</h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {archivedTasks.length} archived task{archivedTasks.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {archivedTasks.length === 0 ? (
        <div className="p-8 text-center">
          <p className="font-serif text-xl text-[var(--text)]">No archived tasks</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Tasks you archive will appear here so you can restore them later.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border)]">
          {archivedTasks.map((task) => (
            <article
              key={task.id}
              className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="truncate font-semibold text-[var(--text)]">
                    {task.title}
                  </h4>

                  {task.starred && (
                    <span className="text-[#f0c040]">★</span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[rgba(193,152,173,0.16)] px-2.5 py-1 text-[10.5px] font-medium text-[#9f6e89]">
                    {statusLabel(task.status)}
                  </span>

                  {task.task_type && (
                    <span className="rounded-full bg-[#f3f2ef] px-2.5 py-1 text-[10.5px] font-medium text-[#8a867f]">
                      {taskTypeLabels[task.task_type] ?? task.task_type}
                    </span>
                  )}

                  <span className="rounded-full bg-[#f3f2ef] px-2.5 py-1 text-[10.5px] font-medium text-[var(--muted)]">
                    Due {formatShortDate(task.due_date)}
                  </span>

                  <span className="rounded-full bg-[#f3f2ef] px-2.5 py-1 text-[10.5px] font-medium text-[var(--muted)]">
                    {task.estimated_minutes}m
                  </span>
                </div>

                {task.notes && (
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                    {task.notes}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRestoreTask(task)}
                  className="rounded-lg bg-[var(--tasks)] px-3 py-2 text-xs font-semibold text-white"
                >
                  Restore
                </button>

                <button
                  type="button"
                  onClick={() => void handleDeleteTask(task)}
                  className="rounded-lg border border-[rgba(201,136,142,0.35)] bg-white px-3 py-2 text-xs font-semibold text-[#a85c64]"
                >
                  Delete permanently
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
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

          {activeSection === 'notifications' && (
            <div>
              <h2 className="text-2xl">Notifications</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Notification settings will live here.
              </p>
            </div>
          )}

          {activeSection === 'jamie' && (
            <div>
              <h2 className="text-2xl">Jamie</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Jamie preferences, prompt behavior, and workflow defaults will live here.
              </p>
            </div>
          )}

          {activeSection === 'data' && (
            <div>
              <h2 className="text-2xl">Data & Privacy</h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
                Data export, privacy, and workspace cleanup settings will live here.
              </p>
            </div>
          )}
        </main>
      </div>
    </section>
  )
}
