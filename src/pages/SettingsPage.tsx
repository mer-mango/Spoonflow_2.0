import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTasks, type Task } from '../hooks/useTasks'

type SettingsSection =
  | 'profile'
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

function taskDateLabel(value?: string | null) {
  if (!value) return 'No due date'

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return 'No due date'
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

function taskTypeLabel(value?: string | null) {
  if (!value) return 'No type'

  const labels: Record<string, string> = {
    admin: 'Admin',
    outreach: 'Outreach',
    client_work: 'Client Work',
    business_development: 'Business Development',
    schedule: 'Schedule',
    other: 'Other',
  }

  return labels[value] ?? value
}

function statusLabel(status: Task['status']) {
  if (status === 'toDo') return 'To Do'
  if (status === 'inProgress') return 'In Progress'
  if (status === 'awaitingReply') return 'Awaiting Reply'
  return 'Done'
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
  const [isLoadingArchive, setIsLoadingArchive] = useState(false)

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

  const loadArchive = useCallback(async () => {
    setIsLoadingArchive(true)

    try {
      const { error } = await loadArchivedTasks()

      if (error) {
        setStatusMessage(error.message)
      }
    } finally {
      setIsLoadingArchive(false)
    }
  }, [loadArchivedTasks])

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

      setGoogleConnected(Boolean(session || localStorage.getItem(GOOGLE_PROVIDER_TOKEN_KEY)))
    }

    void hydrateGoogleStatus()
    void loadFathomMeetings()
    void loadArchive()
  }, [loadArchive, loadFathomMeetings])

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

  const handleRestoreTask = async (taskId: string) => {
    setStatusMessage(null)

    const { error } = await restoreTask(taskId)

    if (error) {
      setStatusMessage(`Restore failed: ${error.message}`)
      return
    }

    setStatusMessage('Task restored.')
    await loadArchive()
  }

  const handleDeleteTask = async (taskId: string) => {
    const confirmed = window.confirm(
      'Permanently delete this task? This cannot be undone.',
    )

    if (!confirmed) return

    setStatusMessage(null)

    const { error } = await deleteTask(taskId)

    if (error) {
      setStatusMessage(`Delete failed: ${error.message}`)
      return
    }

    setStatusMessage('Task permanently deleted.')
    await loadArchive()
  }

  const sections: Array<{
    id: SettingsSection
    label: string
    group: 'Workspace' | 'Preferences' | 'Admin'
  }> = [
    { id: 'profile', label: 'Profile', group: 'Workspace' },
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

  const updateSettingsUrl = (sectionId: SettingsSection) => {
    if (sectionId === 'integrations') {
      window.history.replaceState(null, '', '/settings/integrations')
      return
    }

    if (sectionId === 'archive') {
      window.history.replaceState(null, '', '/settings/archive')
      return
    }

    window.history.replaceState(null, '', '/settings')
  }

  return (
    <section className="mx-auto max-w-6xl rounded-2xl border border-[var(--border)] bg-white">
      <header className="border-b border-[var(--border)] px-6 py-5">
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Manage integrations, preferences, Jamie, archive, and workspace details.
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
                      updateSettingsUrl(item.id)

                      if (item.id === 'archive') {
                        void loadArchive()
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
                    Restore archived items or permanently delete them when you are sure you no longer need them.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadArchive()}
                  disabled={isLoadingArchive}
                  className="w-fit rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--text)] disabled:opacity-50"
                >
                  {isLoadingArchive ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-[var(--border)] bg-white">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <h3 className="font-semibold">Archived Tasks</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {archivedTasks.length} archived task{archivedTasks.length === 1 ? '' : 's'}
                    </p>
                  </div>

                  <span className="rounded-full bg-[rgba(193,152,173,0.16)] px-3 py-1 text-xs font-semibold text-[#9f6e89]">
                    Tasks
                  </span>
                </div>

                {isLoadingArchive ? (
                  <p className="p-5 text-sm text-[var(--muted)]">Loading archived tasks...</p>
                ) : archivedTasks.length === 0 ? (
                  <div className="m-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-8 text-center">
                    <p className="font-serif text-xl text-[var(--text)]">No archived tasks</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      When you archive a task, it will appear here.
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
                          <div className="flex
