import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type Section = 'integrations' | 'profile' | 'notifications' | 'jamie' | 'data'
type IntegrationState = 'connected' | 'available' | 'needsBackend'

type FathomMeeting = {
  id: string
  title: string | null
  meeting_title: string | null
  recording_id: string | null
  share_url: string | null
  scheduled_start_time: string | null
  summary_markdown: string | null
  imported_at: string | null
}

const sections: Section[] = ['integrations', 'profile', 'notifications', 'jamie', 'data']

const nav: { group: string; items: { id: Section; label: string; icon: string }[] }[] = [
  { group: 'Workspace', items: [{ id: 'profile', label: 'Profile', icon: '◐' }, { id: 'integrations', label: 'Integrations', icon: '↻' }] },
  { group: 'Preferences', items: [{ id: 'notifications', label: 'Notifications', icon: '◌' }, { id: 'jamie', label: 'Jamie', icon: '✦' }] },
  { group: 'Admin', items: [{ id: 'data', label: 'Data & Privacy', icon: '◎' }] },
]

const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ')

function Toggle({ on = false }: { on?: boolean }) {
  return <span className={`relative h-5 w-9 rounded-full transition ${on ? 'bg-[var(--nurture)]' : 'bg-[#e0ddd8]'}`}><span className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow transition ${on ? 'left-[19px]' : 'left-[3px]'}`} /></span>
}

function IntegrationCard({ title, desc, connectedLabel = 'Connected', buttonLabel = 'Connect', status = 'available', color, onClick, children }: { title: string; desc: string; connectedLabel?: string; buttonLabel?: string; status?: IntegrationState; color: string; onClick?: () => void | Promise<void>; children?: ReactNode }) {
  const connected = status === 'connected'
  const needsBackend = status === 'needsBackend'

  return (
    <article className={`rounded-[11px] border-[0.5px] bg-white p-5 ${connected ? 'border-[rgba(143,167,144,0.35)]' : 'border-[var(--border)]'}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ backgroundColor: color }}>{title[0]}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium">{title}</p>
              <p className="mt-1 max-w-[560px] text-[11.5px] leading-relaxed text-[var(--muted)]">{desc}</p>
            </div>
            <button
              type="button"
              disabled={connected || needsBackend || !onClick}
              onClick={onClick}
              className={`rounded-[8px] px-3 py-1.5 text-[11.5px] font-medium transition ${connected ? 'bg-[#f0f6f0] text-[#5a7a60]' : needsBackend ? 'cursor-not-allowed bg-[#f5f3f0] text-[var(--muted)]' : 'bg-[var(--jamie)] text-white hover:bg-[#5a1d4a]'}`}
            >
              {connected ? connectedLabel : needsBackend ? 'Backend needed' : buttonLabel}
            </button>
          </div>
          {children}
        </div>
      </div>
    </article>
  )
}

function validSection(value: string | undefined): Section {
  return sections.includes(value as Section) ? (value as Section) : 'integrations'
}

function formatDate(value: string | null) {
  if (!value) return 'No date'
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SettingsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>(() => validSection(params.section))
  const [googleConnected, setGoogleConnected] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [fathomEnabled, setFathomEnabled] = useState(() => localStorage.getItem('spoonflow_fathom_enabled') === 'true')
  const [fathomWorkspaceUrl, setFathomWorkspaceUrl] = useState(() => localStorage.getItem('spoonflow_fathom_workspace_url') ?? '')
  const [fathomMeetings, setFathomMeetings] = useState<FathomMeeting[]>([])
  const [fathomSyncing, setFathomSyncing] = useState(false)

  useEffect(() => setSection(validSection(params.section)), [params.section])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      const providers = data.session?.user.app_metadata?.providers as string[] | undefined
      setGoogleConnected(Boolean(data.session?.provider_token || providers?.includes('google')))
    }
    void load()
  }, [])

  const currentUrl = useMemo(() => window.location.origin, [])
  const fathomWebhookUrl = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
    return supabaseUrl ? `${supabaseUrl.replace('.supabase.co', '.functions.supabase.co')}/fathom-webhook` : 'Your Supabase Function URL/fathom-webhook'
  }, [])

  const loadFathomMeetings = async () => {
    const { data, error } = await supabase
      .from('fathom_meetings')
      .select('id,title,meeting_title,recording_id,share_url,scheduled_start_time,summary_markdown,imported_at')
      .order('scheduled_start_time', { ascending: false })
      .limit(5)

    if (error) {
      if (error.code === '42P01') {
        setStatusMessage('Fathom table not found yet. Run the 002_fathom_meeting_imports.sql migration in Supabase first.')
        return
      }
      setStatusMessage(error.message)
      return
    }

    setFathomMeetings((data as FathomMeeting[]) ?? [])
  }

  useEffect(() => {
    if (section === 'integrations') void loadFathomMeetings()
  }, [section])

  const changeSection = (next: Section) => {
    setSection(next)
    navigate(`/settings/${next}`)
  }

  const connectGoogleCalendar = async () => {
    setStatusMessage('Opening Google Calendar authorization…')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/settings/integrations`,
        scopes: GOOGLE_CALENDAR_SCOPES,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) setStatusMessage(error.message)
  }

  const saveFathomSettings = () => {
    localStorage.setItem('spoonflow_fathom_enabled', String(fathomEnabled))
    localStorage.setItem('spoonflow_fathom_workspace_url', fathomWorkspaceUrl.trim())
    setStatusMessage('Fathom settings saved for this browser. Add the API key and webhook secret in Supabase for automatic imports.')
  }

  const syncFathomNow = async () => {
    setFathomSyncing(true)
    setStatusMessage('Syncing recent Fathom meetings…')
    const { data, error } = await supabase.functions.invoke('fathom-sync', {
      body: { limit: 20 },
    })
    setFathomSyncing(false)

    if (error) {
      setStatusMessage(error.message)
      return
    }

    setStatusMessage(`Fathom sync complete. Imported ${data?.imported ?? 0} meeting${data?.imported === 1 ? '' : 's'}.`)
    await loadFathomMeetings()
  }

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">Settings</h1>
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">Manage integrations, preferences, Jamie, and workspace details.</p>
      </header>

      <div className="flex min-h-[620px] overflow-hidden">
        <aside className="hidden w-[190px] shrink-0 overflow-y-auto border-r-[0.5px] border-[var(--border)] bg-white py-4 md:block">
          {nav.map((group) => <div key={group.group}><p className="px-4 pb-1 pt-3 text-[10px] font-medium uppercase tracking-[0.06em] text-[var(--muted)] first:pt-0">{group.group}</p>{group.items.map((item) => <button key={item.id} type="button" className={`flex w-full items-center gap-2 border-l-2 px-4 py-2 text-left text-[12px] transition ${section === item.id ? 'border-l-[var(--jamie)] bg-[#f5f3f0] font-medium text-[var(--jamie)]' : 'border-l-transparent text-[var(--text)] hover:bg-[#f5f3f0]'}`} onClick={() => changeSection(item.id)}><span className="w-4 text-center opacity-60">{item.icon}</span>{item.label}</button>)}</div>)}
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {statusMessage && <div className="mb-4 rounded-[10px] border-[0.5px] border-[rgba(107,35,88,0.2)] bg-[rgba(107,35,88,0.06)] px-4 py-3 text-[12px] text-[var(--jamie)]">{statusMessage}</div>}

          {section === 'integrations' && <div><h2 className="font-serif text-[21px] font-medium tracking-[-0.3px]">Integrations</h2><p className="mb-5 mt-1 max-w-[600px] text-[12px] leading-relaxed text-[var(--muted)]">Connect the systems that power SpoonFlow’s planning, meeting prep, and follow-up workflows.</p><div className="space-y-3">
            <IntegrationCard title="Google Calendar" desc="Authorize SpoonFlow to read your Google Calendar so Today and Calendar can pull in meetings, medical appointments, and prep blocks." connectedLabel="Connected" buttonLabel="Connect" status={googleConnected ? 'connected' : 'available'} color="#6484a1" onClick={connectGoogleCalendar}><p className="mt-3 rounded-[8px] bg-[#f5f3f0] px-3 py-2 text-[11px] leading-relaxed text-[var(--muted)]">Vercel URL to add in Supabase redirect settings: <span className="font-medium text-[var(--text)]">{currentUrl}/settings/integrations</span></p></IntegrationCard>
            <IntegrationCard title="Supabase" desc="Stores contacts, tasks, content items, goals, Jamie conversations, app settings, and imported Fathom meeting transcripts." status="connected" color="#8fa790" />
            <IntegrationCard title="Anthropic Claude" desc="Powers Jamie through the Supabase Edge Function proxy. Configure this with ANTHROPIC_API_KEY in Supabase, not in the Vercel frontend." status="needsBackend" color="#6b2358" />
            <IntegrationCard title="Fathom" desc="Import meeting transcripts, summaries, and action items into SpoonFlow through a Supabase Edge Function and optional Fathom webhook." connectedLabel="Configured" buttonLabel="Save setup" status={fathomEnabled ? 'connected' : 'available'} color="#c198ad" onClick={saveFathomSettings}><div className="mt-3 grid gap-3 rounded-[10px] border-[0.5px] border-[var(--border)] bg-[#fffdfd] p-3"><label className="flex items-center justify-between gap-3 text-[12px]"><span>Enable Fathom imports</span><button type="button" onClick={() => setFathomEnabled((prev) => !prev)}><Toggle on={fathomEnabled} /></button></label><label className="grid gap-1 text-[11px] text-[var(--muted)]">Fathom workspace or login URL<input value={fathomWorkspaceUrl} onChange={(event) => setFathomWorkspaceUrl(event.target.value)} placeholder="https://fathom.video/..." className="rounded-[8px] border-[0.5px] border-[var(--border)] px-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[rgba(193,152,173,0.6)]" /></label><div className="rounded-[8px] bg-[#f5f3f0] px-3 py-2 text-[11px] leading-relaxed text-[var(--muted)]">Webhook destination URL: <span className="font-medium text-[var(--text)]">{fathomWebhookUrl}</span></div><div className="flex flex-wrap gap-2"><button type="button" onClick={saveFathomSettings} className="rounded-[8px] bg-[var(--jamie)] px-3 py-1.5 text-[11.5px] font-medium text-white hover:bg-[#5a1d4a]">Save Fathom setup</button><button type="button" onClick={syncFathomNow} disabled={fathomSyncing} className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] hover:bg-[#f5f3f0] disabled:opacity-50">{fathomSyncing ? 'Syncing…' : 'Sync recent meetings'}</button><button type="button" onClick={loadFathomMeetings} className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-1.5 text-[11.5px] font-medium text-[var(--text)] hover:bg-[#f5f3f0]">Refresh list</button></div>{fathomMeetings.length > 0 && <div className="mt-1 space-y-2"><p className="text-[10.5px] font-medium uppercase tracking-[0.05em] text-[var(--muted)]">Recently imported</p>{fathomMeetings.map((meeting) => <article key={meeting.id} className="rounded-[8px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-[12px] font-medium">{meeting.meeting_title || meeting.title || 'Untitled meeting'}</p><p className="mt-0.5 text-[10.5px] text-[var(--muted)]">{formatDate(meeting.scheduled_start_time)} · Recording {meeting.recording_id}</p></div>{meeting.share_url && <a className="text-[10.5px] font-medium text-[var(--jamie)]" href={meeting.share_url} target="_blank" rel="noreferrer">Open Fathom</a>}</div>{meeting.summary_markdown && <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[var(--muted)]">{meeting.summary_markdown.replaceAll('#', '').trim()}</p>}</article>)}</div>}</div></IntegrationCard>
          </div></div>}

          {section === 'profile' && <div><h2 className="font-serif text-[21px] font-medium tracking-[-0.3px]">Profile</h2><p className="mb-5 mt-1 max-w-[560px] text-[12px] leading-relaxed text-[var(--muted)]">Basic workspace details used across dashboards and Jamie context.</p><div className="rounded-[11px] border-[0.5px] border-[var(--border)] bg-white p-5"><label className="text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">Name</label><input defaultValue="Meredith" className="mt-2 w-full rounded-[8px] border-[0.5px] border-[var(--border)] px-3 py-2 text-[13px] outline-none" /><label className="mt-4 block text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">Company</label><input defaultValue="Empower Health Strategies" className="mt-2 w-full rounded-[8px] border-[0.5px] border-[var(--border)] px-3 py-2 text-[13px] outline-none" /></div></div>}
          {section === 'notifications' && <div><h2 className="font-serif text-[21px] font-medium tracking-[-0.3px]">Notifications</h2><p className="mb-5 mt-1 max-w-[560px] text-[12px] leading-relaxed text-[var(--muted)]">Choose which prompts and reminders should show up in SpoonFlow.</p><div className="space-y-2">{['Morning planning prompt', 'Nurture follow-up reminders', 'Content due soon reminders', 'Calendar sync alerts'].map((item, index) => <div key={item} className="flex items-center justify-between rounded-[11px] border-[0.5px] border-[var(--border)] bg-white p-4"><span className="text-[13px]">{item}</span><Toggle on={index < 3} /></div>)}</div></div>}
          {section === 'jamie' && <div><h2 className="font-serif text-[21px] font-medium tracking-[-0.3px]">Jamie</h2><p className="mb-5 mt-1 max-w-[560px] text-[12px] leading-relaxed text-[var(--muted)]">Tune Jamie’s support across writing, planning, meetings, and relationship follow-up.</p><div className="rounded-[11px] border-[0.5px] border-[var(--border)] bg-white p-5"><p className="text-[10.5px] uppercase tracking-[0.05em] text-[var(--muted)]">Favorite quick chips</p><div className="mt-3 flex flex-wrap gap-2">{['Sharpen hook', 'What’s missing', 'Make concise', 'More emotional', 'Stronger ending'].map((chip) => <span key={chip} className="rounded-full bg-[rgba(107,35,88,0.08)] px-3 py-1.5 text-[11px] text-[var(--jamie)]">{chip}</span>)}</div></div></div>}
          {section === 'data' && <div><h2 className="font-serif text-[21px] font-medium tracking-[-0.3px]">Data & Privacy</h2><p className="mb-5 mt-1 max-w-[560px] text-[12px] leading-relaxed text-[var(--muted)]">Export or review the workspace data SpoonFlow uses.</p><div className="grid gap-3 md:grid-cols-2"><div className="rounded-[11px] border-[0.5px] border-[var(--border)] bg-white p-5"><p className="text-[13px] font-medium">Export workspace</p><p className="mt-1 text-[11.5px] text-[var(--muted)]">Download contacts, tasks, content, goals, and Fathom imports.</p></div><div className="rounded-[11px] border-[0.5px] border-[var(--border)] bg-white p-5"><p className="text-[13px] font-medium">Review Jamie context</p><p className="mt-1 text-[11.5px] text-[var(--muted)]">See what Jamie can reference while helping you.</p></div></div></div>}
        </main>
      </div>
    </section>
  )
}
