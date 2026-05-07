import { Modal } from '../shared/Modal'
import type { NurtureContact } from '../../hooks/useNurture'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString()
}

export function NurtureModal({
  open,
  contact,
  onClose,
}: {
  open: boolean
  contact: NurtureContact | null
  onClose: () => void
}) {
  if (!contact) return null

  return (
    <Modal open={open} onClose={onClose} title={contact.name}>
      <div className="space-y-3">
        <section className="rounded-xl border border-[var(--border)] p-3">
          <h3 className="font-serif text-lg text-[var(--nurture)]">Nurture Details</h3>
          <p className="text-sm text-[var(--muted)]">Next check-in: {fmtDate(contact.next_nurture_date)}</p>
          <p className="text-sm text-[var(--muted)]">Last meeting: {fmtDate(contact.next_call_date)}</p>
        </section>
        <section className="rounded-xl border border-[var(--border)] p-3">
          <h3 className="font-serif text-lg">Check-in Frequency</h3>
          <p className="text-sm text-[var(--muted)]">
            Current frequency: {contact.nurture_frequency_days ?? '—'} days
          </p>
        </section>
        <section className="rounded-xl border border-[var(--border)] p-3">
          <h3 className="font-serif text-lg">Touch History</h3>
          <p className="text-sm text-[var(--muted)]">Touch history table wiring next pass.</p>
        </section>
      </div>
    </Modal>
  )
}
