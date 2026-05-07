import { useMemo, useState } from 'react'
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

export function ContactsPage() {
  const { contacts, isLoading, createContact } = useContacts()
  const { notify } = useToast()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const filtered = useMemo(
    () =>
      contacts.filter((contact) => {
        const q = query.toLowerCase()
        return (
          contact.name.toLowerCase().includes(q) ||
          (contact.email ?? '').toLowerCase().includes(q) ||
          (contact.company ?? '').toLowerCase().includes(q)
        )
      }),
    [contacts, query],
  )

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-4">
        <h1 className="text-2xl">Contacts</h1>
      </header>

      <div className="rounded-2xl bg-white p-4">
        <div className="mb-4 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search contacts"
            className="rounded-lg border border-[var(--border)] px-3 py-2"
          />
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="New contact name"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
            />
            <input
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="Email"
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2"
            />
          </div>
          <button
            type="button"
            className="rounded-lg bg-[var(--jamie)] px-4 py-2 text-white"
            onClick={async () => {
              if (!newName.trim()) return
              const { error } = await createContact({ name: newName.trim(), email: newEmail.trim() || null })
              if (!error) {
                setNewName('')
                setNewEmail('')
                notify('Contact created')
              }
            }}
          >
            Add
          </button>
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--muted)]">Loading contacts...</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-[var(--muted)]">
                  <tr>
                    <th className="pb-2">Contact</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Company</th>
                    <th className="pb-2">Next meeting</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => (
                    <tr key={contact.id} className="cursor-pointer border-t border-[var(--border)]" onClick={() => setSelected(contact)}>
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs text-white"
                            style={{ backgroundColor: contact.color ?? '#8ba5a8' }}
                          >
                            {initials(contact.name)}
                          </span>
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-xs text-[var(--muted)]">{contact.role || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2">{contact.email || '—'}</td>
                      <td className="py-2">{contact.company || '—'}</td>
                      <td className="py-2">{contact.next_call_date ? new Date(contact.next_call_date).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-2 md:hidden">
              {filtered.map((contact) => (
                <button key={contact.id} className="rounded-xl border border-[var(--border)] p-3 text-left" onClick={() => setSelected(contact)}>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-[var(--muted)]">{contact.email || contact.company || 'No details yet'}</p>
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
