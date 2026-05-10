import { useNavigate } from 'react-router-dom'
import { NurtureBuckets } from '../components/nurture/NurtureBuckets'
import { useNurture } from '../hooks/useNurture'

export function NurturePage() {
  const navigate = useNavigate()
  const { contacts, isLoading } = useNurture()

  return (
    <section className="overflow-hidden rounded-xl border-[0.5px] border-[var(--border)] bg-[var(--bg)]">
      <header className="border-b-[0.5px] border-[var(--border)] bg-white px-5 py-4">
        <h1 className="font-serif text-[22px] font-medium tracking-[-0.4px]">
          Nurture
        </h1>
        <p className="mt-0.5 text-[11px] text-[var(--muted)]">
          Relationship follow-ups grouped by timing and urgency.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b-[0.5px] border-[var(--border)] bg-[var(--bg)] px-5 py-3">
        <input
          placeholder="Search nurture contacts"
          className="max-w-[220px] flex-1 rounded-[7px] border-[0.5px] border-[var(--border)] bg-white px-3 py-2 text-[11.5px] outline-none focus:border-[rgba(143,167,144,0.5)]"
        />

        <span className="ml-auto text-[11px] text-[var(--muted)]">
          {contacts.length} contacts
        </span>
      </div>

      <div className="p-4">
        {isLoading ? (
          <p className="text-[12px] text-[var(--muted)]">
            Loading nurture contacts…
          </p>
        ) : (
          <NurtureBuckets
            contacts={contacts}
            onOpen={(contact) => navigate(`/contacts/${contact.id}?tab=nurture`)}
          />
        )}
      </div>
    </section>
  )
}
