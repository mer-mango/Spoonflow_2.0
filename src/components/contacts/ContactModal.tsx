import { Modal } from '../shared/Modal'
import type { Contact } from '../../hooks/useContacts'
import { useMemo } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { TaskCard } from '../shared/TaskCard'

type Props = {
  open: boolean
  contact: Contact | null
  onClose: () => void
}

export function ContactModal({ open, contact, onClose }: Props) {
  const { tasks, updateTask, deleteTask } = useTasks()

  const contactTasks = useMemo(
    () => tasks.filter((task) => task.contact_id === contact?.id),
    [tasks, contact?.id],
  )

  if (!contact) return null

  return (
    <Modal open={open} onClose={onClose} title={contact.name}>
      <div className="grid gap-4">
        <section className="rounded-xl border border-[var(--border)] p-3">
          <h3 className="mb-2 font-serif text-lg">Information</h3>

          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-[var(--muted)]">Role:</span> {contact.role || '—'}
            </p>

            <p>
              <span className="text-[var(--muted)]">Company:</span> {contact.company || '—'}
            </p>

            <p>
              <span className="text-[var(--muted)]">Email:</span> {contact.email || '—'}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--border)] p-3">
          <h3 className="mb-2 font-serif text-lg">Tasks</h3>

          <div className="grid gap-2">
            {contactTasks.length === 0 && (
              <p className="text-sm text-[var(--muted)]">
                No tasks linked to this contact.
              </p>
            )}

            {contactTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={() => undefined}
                onDelete={(item) => void deleteTask(item.id)}
                onToggle={(item) =>
                  void updateTask(item.id, {
                    status: item.status === 'done' ? 'toDo' : 'done',
                  })
                }
              />
            ))}
          </div>
        </section>
      </div>
    </Modal>
  )
}
