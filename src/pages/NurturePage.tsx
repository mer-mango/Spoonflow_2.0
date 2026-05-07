import { useState } from 'react'
import { NurtureBuckets } from '../components/nurture/NurtureBuckets'
import { NurtureModal } from '../components/nurture/NurtureModal'
import { useToast } from '../components/shared/Toast'
import { useNurture, type NurtureContact } from '../hooks/useNurture'

export function NurturePage() {
  const { contacts, isLoading, markDone } = useNurture()
  const { notify } = useToast()
  const [selected, setSelected] = useState<NurtureContact | null>(null)

  return (
    <section className="space-y-4">
      <header className="rounded-2xl bg-white p-4">
        <h1 className="text-2xl">Nurture</h1>
      </header>

      {isLoading ? (
        <div className="rounded-2xl bg-white p-4 text-sm text-[var(--muted)]">Loading nurture contacts...</div>
      ) : (
        <NurtureBuckets
          contacts={contacts}
          onOpen={setSelected}
          onDone={async (contact) => {
            const { error } = await markDone(contact)
            if (!error) notify('Nurture touch logged and date advanced')
          }}
        />
      )}

      <NurtureModal open={Boolean(selected)} contact={selected} onClose={() => setSelected(null)} />
    </section>
  )
}
