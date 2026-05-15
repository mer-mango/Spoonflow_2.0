import { useState } from 'react'
import type { CalendarItem } from './EventPill'
import { TaskModal } from '../shared/TaskModal'
import { ContactModal } from '../contacts/ContactModal'
import { useContacts, type Contact } from '../../hooks/useContacts'
import { useTasks, type Task } from '../../hooks/useTasks'

const EHS_MEETINGS_CALENDAR_ID = 'meredith@empowerhealthstrategies.com'

type DayPanelProps = {
  dateKey: string
  events: CalendarItem[]
}

type ContactModalTab = 'information' | 'interactions' | 'notes' | 'tasks' | 'nurture'

function dateFromLocalKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year, month - 1, day)
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function durationLabel(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  const minutes = Math.max(0, Math.round((end - start) / 60000))

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours && mins) return `${hours}h ${mins}m`
  if (hours) return `${hours}h`
  return `${mins}m`
}

function formatPanelDate(dateKey: string) {
  return dateFromLocalKey(dateKey).toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function dateKeyFromDateValue(value?: string | null) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
      <path
        d="M5.4 8.6l3.2-3.2M4.7 10H3.9A2.4 2.4 0 0 1 2.2 5.9l1.2-1.2A2.4 2.4 0 0 1 6.8 8M9.3 4h.8a2.4 2.4 0 0 1 1.7 4.1l-1.2 1.2A2.4 2.4 0 0 1 7.2 6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SectionHeader({
  label,
  count,
}: {
  label: string
  count: number
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h3 className="font-sans text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
        {label}
      </h3>

      <span className="rounded-full bg-[#f3f2ef] px-2 py-0.5 text-[10px] font-medium text-[var(--muted)]">
        {count}
      </span>
    </div>
  )
}

export function DayPanel({
  dateKey,
  events,
}: DayPanelProps) {
  const { contacts, createContact, updateContact } = useContacts()
  const { tasks, updateTask, loadTasks } = useTasks()

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [contactModalTab, setContactModalTab] =
    useState<ContactModalTab>('information')

  const contactNameById = new Map(
    contacts.map((contact) => [contact.id, contact.name]),
  )

  const contactById = new Map(
    contacts.map((contact) => [contact.id, contact]),
  )

  const openContactModal = (
    contactId: string,
    tab: ContactModalTab,
  ) => {
    const contact = contactById.get(contactId)

    if (!contact) return

    setSelectedContact(contact)
    setContactModalTab(tab)
    setContactModalOpen(true)
  }

  const closeContactModal = () => {
    setContactModalOpen(false)
    setSelectedContact(null)
    setContactModalTab('information')
  }

  const sortedEvents = [...events].sort(
    (a, b) => +new Date(a.startTime) - +new Date(b.startTime),
  )

  const selectedDayTasks = tasks.filter(
    (task) =>
      !task.archived &&
      task.status !== 'done' &&
      dateKeyFromDateValue(task.due_date) === dateKey,
  )

  const selectedDayNurtures = contacts.filter(
    (contact) =>
      Boolean(contact.nurture_frequency_days) &&
      dateKeyFromDateValue(contact.next_nurture_date) === dateKey,
  )

  const totalItems =
    sortedEvents.length + selectedDayTasks.length + selectedDayNurtures.length

  return (
    <>
      <aside className="w-full rounded-2xl border border-[var(--border)] bg-white p-4 lg:w-[300px]">
        <h2 className="font-serif text-xl text-[var(--text)]">
          {formatPanelDate(dateKey)}
        </h2>

        <p className="mt-1 text-sm text-[var(--muted)]">
          {totalItems} scheduled {totalItems === 1 ? 'item' : 'items'}
        </p>

        <div className="mt-4 space-y-5">
          {sortedEvents.length > 0 && (
            <section>
              <SectionHeader label="Meetings" count={sortedEvents.length} />

              <div className="space-y-2">
                {sortedEvents.map((event) => {
                  const color = event.color ?? '#6484a1'
                  const isEhsMeeting =
                    event.calendarId === EHS_MEETINGS_CALENDAR_ID
                  const contactName = event.contactId
                    ? contactNameById.get(event.contactId) ?? null
                    : null
                  const canOpenInteractionDossier =
                    isEhsMeeting &&
                    Boolean(event.contactId && contactById.has(event.contactId))

                  return (
                    <article
                      key={`${event.id}-${event.startTime}`}
                      onClick={() => {
                        if (canOpenInteractionDossier && event.contactId) {
                          openContactModal(event.contactId, 'interactions')
                        }
                      }}
                      className={`rounded-xl border border-[var(--border)] bg-white p-3 ${
                        canOpenInteractionDossier
                          ? 'cursor-pointer transition hover:bg-[#f8fbfd]'
                          : ''
                      }`}
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="truncate text-sm font-semibold text-[var(--text)]">
                            {event.title}
                          </h4>

                          {event.meetingLink && (
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(clickEvent) => clickEvent.stopPropagation()}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f5f3f0] text-[var(--muted)] transition hover:bg-[#ece8e2] hover:text-[var(--text)]"
                              title="Open meeting link"
                              aria-label="Open meeting link"
                            >
                              <LinkIcon />
                            </a>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {timeLabel(event.startTime)} (
                          {durationLabel(event.startTime, event.endTime)})
                        </p>

                        {isEhsMeeting && event.contactId && contactName && (
                          <button
                            type="button"
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation()
                              openContactModal(event.contactId!, 'information')
                            }}
                            className="mt-2 inline-flex items-center rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92] transition hover:bg-[rgba(139,165,168,0.24)] hover:text-[#54777a]"
                            title="Open contact profile"
                          >
                            {contactName}
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {selectedDayTasks.length > 0 && (
            <section>
              <SectionHeader label="Tasks" count={selectedDayTasks.length} />

              <div className="space-y-2">
                {selectedDayTasks.map((task) => {
                  const contactName = task.contact_id
                    ? contactNameById.get(task.contact_id) ?? null
                    : null

                  return (
                    <article
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-3 transition hover:bg-[#fcfafc]"
                      style={{ borderLeft: '4px solid #c198ad' }}
                    >
                      <h4 className="text-sm font-semibold text-[var(--text)]">
                        {task.title}
                      </h4>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Due today
                        {task.estimated_minutes ? ` · ${task.estimated_minutes}m` : ''}
                      </p>

                      {task.contact_id && contactName && (
                        <button
                          type="button"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            openContactModal(task.contact_id!, 'information')
                          }}
                          className="mt-2 inline-flex items-center rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92] transition hover:bg-[rgba(139,165,168,0.24)] hover:text-[#54777a]"
                          title="Open contact profile"
                        >
                          {contactName}
                        </button>
                      )}
                    </article>
                  )
                })}
              </div>
            </section>
          )}

          {selectedDayNurtures.length > 0 && (
            <section>
              <SectionHeader label="Nurture" count={selectedDayNurtures.length} />

              <div className="space-y-2">
                {selectedDayNurtures.map((contact) => (
                  <article
                    key={contact.id}
                    onClick={() => openContactModal(contact.id, 'nurture')}
                    className="cursor-pointer rounded-xl border border-[var(--border)] bg-white p-3 transition hover:bg-[#f8fdf8]"
                    style={{ borderLeft: '4px solid #8fa790' }}
                  >
                    <h4 className="font-serif text-sm font-medium text-[var(--text)]">
                      {contact.name}
                    </h4>

                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        openContactModal(contact.id, 'information')
                      }}
                      className="mt-2 inline-flex items-center rounded-full bg-[rgba(139,165,168,0.16)] px-2 py-0.5 text-[10px] font-medium text-[#6f8f92] transition hover:bg-[rgba(139,165,168,0.24)] hover:text-[#54777a]"
                      title="Open contact profile"
                    >
                      {contact.name}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {totalItems === 0 && (
            <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--muted)]">
              Nothing scheduled for this day.
            </div>
          )}
        </div>
      </aside>

      <TaskModal
        open={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={async (id, patch) => {
          if (!id) return

          await updateTask(id, patch)
        }}
      />

      <ContactModal
        open={contactModalOpen}
        contact={selectedContact}
        initialTab={contactModalTab}
        onClose={closeContactModal}
        onCreate={createContact}
        onUpdate={updateContact}
        onTasksChanged={loadTasks}
      />
    </>
  )
}
