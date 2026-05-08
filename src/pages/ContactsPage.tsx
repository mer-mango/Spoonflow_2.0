import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useContacts, type Contact } from '../hooks/useContacts'
import { ContactModal } from '../components/contacts/ContactModal'
import { useToast } from '../components/shared/Toast'
import { useTasks } from '../hooks/useTasks'

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function formatDate(value?: string | null) {
  if (!value) return '—'

  try {
    return new Date(value).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function isOverdue(value?: string | null) {
  if (!value) return false

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const date = new Date(value)
  date.setHours(0, 0, 0, 0)

  return date.getTime() < today.getTime()
}

function exportContactsCsv(contacts: Contact[]) {
  const headers = [
    'name',
    'email',
    'role',
    'company',
    'linkedin_url',
    'website',
    'scheduling_link',
    'city',
    'state',
    'from_note',
    'about',
    'notes',
    'starred',
    'nurture_frequency_days',
    'next_nurture_date',
    'next_call_date',
  ]

  const rows = contacts.map((contact) =>
    headers.map((header) => {
      const value = contact[header as keyof Contact] ?? ''
      return `"${String(value).replace(/"/g, '""')}"`
    }),
  )

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `spoonflow-contacts-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()

  URL.revokeObjectURL(url)
}

export function ContactsPage() {
  const navigate = useNavigate()
  const params = useParams()

  const { contacts, isLoading, createContact, updateContact, importContactsCsv } = useContacts()
  const { tasks } = useTasks()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  useEffect(() => {
    if (params.id === 'new') {
      setSelected(null)
      setModalOpen(true)
      return
    }

    if (params.id && contacts.length > 0) {
      const match = contacts.find((contact) => contact.id === params.id)

      if (match) {
        setSelected(match)
        setModalOpen(true)
      }
    }
  }, [params.id, contacts])

  const taskCountByContactId = useMemo(() => {
    const counts = new Map<string, number>()

    tasks.forEach((task) => {
      if (!task.contact_id) return
      counts.set(task.contact_id, (counts.get(task.contact_id) ?? 0) + 1)
    })

    return counts
  }, [tasks])

  const filtered = useMemo(
    () =>
      contacts
        .filter((contact) => {
          const q = query.toLowerCase()

          return (
            contact.name.toLowerCase().includes(q) ||
            (contact.email ?? '').toLowerCase().includes(q) ||
            (contact.company ?? '').toLowerCase().includes(q) ||
            (contact.role ?? '').toLowerCase().includes(q) ||
            (contact.from_note ?? '').toLowerCase().includes(q)
          )
        })
        .sort((a, b) => {
          if (a.starred !== b.starred) return a.starred ? -1 : 1
          return a.name.localeCompare(b.name)
        }),
    [contacts, query],
  )

  const closeContactModal = () => {
    setModalOpen(false)
    setSelected(null)

    if (params.id) {
      navigate('/contacts')
    }
  }

  const handleImportCsv = async (file?: File | null) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportMessage('Please upload a CSV file.')
      return
    }

    setIsImporting(true)
    setImportMessage(null)

    try {
      const result = await importContactsCsv(file)

      const summary = [
        `${result.created} created`,
        `${result.updated} updated`,
        `${result.skipped} skipped`,
      ].join(' · ')

      if (result.errors.length > 0) {
        setImportMessage(`${summary}. ${result.errors.join(' ')}`)
      } else {
        setImportMessage(`CSV import complete: ${summary}.`)
        notify('Contacts imported')
      }
    } finally {
      setIsImporting(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-[var(--border)] bg-white">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl">Contacts</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {contacts.length} contact{contacts.length === 1 ? '' : 's'} · {filtered.length} shown
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void handleImportCsv(event.target.files?.[0])}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:bg-black/[0.03] disabled:opacity-50"
            >
              {isImporting ? 'Importing...' : 'Import CSV'}
            </button>

            <button
              type="button"
              onClick={() => {
                exportContactsCsv(contacts)
                notify('Contacts exported')
              }}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:bg-black/[0.03]"
            >
              Export CSV
            </button>

            <button
              type="button"
              className="rounded-full bg-[var(--jamie)] px-4 py-2 text-sm font-medium text-white shadow-sm"
              onClick={() => {
                navigate('/contacts/new')
              }}
            >
              + New Contact
            </button>
          </div>
        </div>

        <div className="px-5 py-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contacts, companies, email..."
            className="w-full rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm outline-none focus:border-[var(--meeting)]"
          />
        </div>
      </header>

      {importMessage && (
        <div className="rounded-xl border border-[rgba(107,35,88,0.18)] bg-[rgba(107,35,88,0.06)] px-4 py-3 text-sm text-[var(--jamie)]">
          {importMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {isLoading ? (
          <p className="p-5 text-sm text-[var(--muted)]">Loading contacts...</p>
        ) : filtered.length === 0 ? (
          <div className="m-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-8 text-center">
            <p className="font-serif text-xl text-[var(--text)]">No contacts found</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try another search, import a CSV, or create a new contact.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="sticky top-0 border-b border-[var(--border)] bg-white text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">
                  <tr>
                    <th className="w-[42px] px-3 py-3" />
                    <th className="w-[32%] px-3 py-3 font-medium">Contact</th>
                    <th className="w-[28%] px-3 py-3 font-medium">Email</th>
                    <th className="w-[16%] px-3 py-3 font-medium">Next meeting</th>
                    <th className="w-[10%] px-3 py-3 font-medium">Tasks</th>
                    <th className="w-[14%] px-3 py-3 font-medium">Nurture</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((contact) => {
                    const taskCount = taskCountByContactId.get(contact.id) ?? 0
                    const nurtureOverdue = isOverdue(contact.next_nurture_date)

                    return (
                      <tr
                        key={contact.id}
                        className="cursor-pointer border-b border-[rgba(44,44,42,0.06)] transition hover:bg-[#faf9f8]"
                        onClick={() => {
                          navigate(`/contacts/${contact.id}`)
                        }}
                      >
                        <td className="px-3 py-3 align-middle">
                          <button
                            type="button"
                            className={`flex h-6 w-6 items-center justify-center text-base transition ${
                              contact.starred
                                ? 'text-[#d8a923]'
                                : 'text-[#d8d5cf] hover:text-[#b8b3aa]'
                            }`}
                            onClick={async (event) => {
                              event.stopPropagation()

                              const { error } = await updateContact(contact.id, {
                                starred: !contact.starred,
                              })

                              if (!error) {
                                notify(contact.starred ? 'Contact unstarred' : 'Contact starred')
                              }
                            }}
                            aria-label={contact.starred ? 'Unstar contact' : 'Star contact'}
                          >
                            ★
                          </button>
                        </td>

                        <td className="px-3 py-3 align-middle">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-semibold text-white"
                              style={{ backgroundColor: contact.color ?? '#8ba5a8' }}
                            >
                              {contact.image_url ? (
                                <img
                                  src={contact.image_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                contact.initials || initials(contact.name)
                              )}
                            </span>

                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--text)]">
                                {contact.name}
                              </p>
                              <p className="truncate text-xs text-[var(--muted)]">
                                {[contact.role, contact.company].filter(Boolean).join(' · ') || '—'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 align-middle text-[var(--muted)]">
                          {contact.email ? (
                            <button
                              type="button"
                              className="block max-w-full truncate text-left text-xs hover:text-[var(--meeting)] hover:underline"
                              onClick={(event) => {
                                event.stopPropagation()
                                void navigator.clipboard.writeText(contact.email ?? '')
                                notify('Email copied')
                              }}
                            >
                              {contact.email}
                            </button>
                          ) : (
                            <span className="text-xs text-[#c8c5c0]">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-middle">
                          {contact.next_call_date ? (
                            <span className="inline-flex rounded-md bg-[rgba(100,132,161,0.12)] px-2 py-1 text-xs font-medium text-[var(--meeting)]">
                              {formatDate(contact.next_call_date)}
                            </span>
                          ) : (
                            <span className="text-xs text-[#c8c5c0]">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-middle">
                          {taskCount > 0 ? (
                            <span className="inline-flex rounded-md bg-[rgba(193,152,173,0.18)] px-2 py-1 text-xs font-medium text-[#a36f8c]">
                              {taskCount}
                            </span>
                          ) : (
                            <span className="text-xs text-[#c8c5c0]">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3 align-middle">
                          {contact.next_nurture_date ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                nurtureOverdue ? 'text-[#c9888e]' : 'text-[#8fa790]'
                              }`}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor: nurtureOverdue ? '#c9888e' : '#8fa790',
                                }}
                              />
                              {nurtureOverdue ? 'overdue' : formatDate(contact.next_nurture_date)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-[#c0bdb8]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#ddd]" />
                              none
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 p-3 md:hidden">
              {filtered.map((contact) => (
                <button
                  key={contact.id}
                  className="rounded-xl border border-[var(--border)] bg-white p-3 text-left"
                  onClick={() => {
                    navigate(`/contacts/${contact.id}`)
                  }}
                >
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-[var(--muted)]">
                    {contact.email || contact.company || 'No details yet'}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <ContactModal
        open={modalOpen}
        contact={selected}
        onClose={closeContactModal}
        onCreate={createContact}
        onUpdate={updateContact}
      />
    </section>
  )
}
