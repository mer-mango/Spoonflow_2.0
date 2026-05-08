import { useMemo, useRef, useState } from 'react'
import { useContacts, type Contact } from '../hooks/useContacts'
import { ContactModal } from '../components/contacts/ContactModal'
import { useToast } from '../components/shared/Toast'

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

export function ContactsPage() {
  const { contacts, isLoading, createContact, importContactsCsv } = useContacts()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)

  const filtered = useMemo(
    () =>
      contacts.filter((contact) => {
        const q = query.toLowerCase()

        return (
          contact.name.toLowerCase().includes(q) ||
          (contact.email ?? '').toLowerCase().includes(q) ||
          (contact.company ?? '').toLowerCase().includes(q) ||
          (contact.role ?? '').toLowerCase().includes(q)
        )
      }),
    [contacts, query],
  )

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
      <header className="rounded-2xl bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl">Contacts</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {contacts.length} contact{contacts.length === 1 ? '' : 's'}
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
              className="rounded-full bg-[var(--jamie)] px-4 py-2 text-sm font-medium text-white shadow-sm"
              onClick={async () => {
                if (!newName.trim()) return

                const { error } = await createContact({
                  name: newName.trim(),
                  email: newEmail.trim() || null,
                })

                if (!error) {
                  setNewName('')
                  setNewEmail('')
                  notify('Contact created')
                }
              }}
            >
              + New Contact
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-2xl bg-white p-4">
        {importMessage && (
          <div className="mb-4 rounded-xl border border-[rgba(107,35,88,0.18)] bg-[rgba(107,35,88,0.06)] px-4 py-3 text-sm text-[var(--jamie)]">
            {importMessage}
          </div>
        )}

        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contacts, companies, email..."
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--meeting)]"
          />

          <div className="grid gap-2 md:grid-cols-[1fr_1fr]">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Quick add name"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--meeting)]"
            />

            <input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Quick add email"
              className="rounded-full border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--meeting)]"
            />
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading contacts...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-6 text-center">
            <p className="font-serif text-xl text-[var(--text)]">No contacts found</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try another search, add a contact, or import a CSV.
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    <th className="pb-3 pl-2">Contact</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Company</th>
                    <th className="pb-3">Next meeting</th>
                    <th className="pb-3 pr-2 text-right">Nurture</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((contact) => (
                    <tr
                      key={contact.id}
                      className="cursor-pointer border-b border-[var(--border)] transition hover:bg-black/[0.02]"
                      onClick={() => setSelected(contact)}
                    >
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className={`text-base ${
                              contact.starred ? 'text-[#d8a923]' : 'text-[var(--border)]'
                            }`}
                            onClick={(event) => {
                              event.stopPropagation()
                            }}
                            aria-label={contact.starred ? 'Starred contact' : 'Unstarred contact'}
                          >
                            ★
                          </button>

                          <span
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: contact.color ?? '#8ba5a8' }}
                          >
                            {contact.initials || initials(contact.name)}
                          </span>

                          <div>
                            <p className="font-semibold text-[var(--text)]">{contact.name}</p>
                            <p className="text-xs text-[var(--muted)]">
                              {[contact.role, contact.company].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 text-[var(--muted)]">
                        {contact.email ? (
                          <button
                            type="button"
                            className="hover:text-[var(--meeting)]"
                            onClick={(event) => {
                              event.stopPropagation()
                              void navigator.clipboard.writeText(contact.email ?? '')
                              notify('Email copied')
                            }}
                          >
                            {contact.email}
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="py-3 text-[var(--muted)]">{contact.company || '—'}</td>

                      <td className="py-3">
                        {contact.next_call_date ? (
                          <span className="rounded-lg bg-[rgba(100,132,161,0.12)] px-2 py-1 text-xs font-medium text-[var(--meeting)]">
                            {formatDate(contact.next_call_date)}
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">—</span>
                        )}
                      </td>

                      <td className="py-3 pr-2 text-right">
                        {contact.next_nurture_date ? (
                          <span className="rounded-lg bg-[rgba(143,167,144,0.14)] px-2 py-1 text-xs font-medium text-[#6f8d70]">
                            {formatDate(contact.next_nurture_date)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 md:hidden">
              {filtered.map((contact) => (
                <button
                  key={contact.id}
                  className="rounded-xl border border-[var(--border)] p-3 text-left"
                  onClick={() => setSelected(contact)}
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

      <ContactModal open={Boolean(selected)} contact={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
