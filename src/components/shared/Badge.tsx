type BadgeVariant =
  | 'todo'
  | 'inProgress'
  | 'awaitingReply'
  | 'done'
  | 'linkedin'
  | 'substack'
  | 'tasks'
  | 'content'
  | 'nurture'

const classes: Record<BadgeVariant, string> = {
  todo: 'bg-[var(--todo)] text-[var(--text)]',
  inProgress: 'bg-[var(--inprog)] text-[var(--text)]',
  awaitingReply: 'bg-[var(--await)] text-[var(--text)]',
  done: 'bg-[var(--done)] text-[var(--text)]',
  linkedin: 'bg-[var(--meeting)] text-white',
  substack: 'bg-[var(--content)] text-[var(--text)]',
  tasks: 'bg-[var(--tasks)] text-[var(--text)]',
  content: 'bg-[var(--content)] text-[var(--text)]',
  nurture: 'bg-[var(--nurture)] text-[var(--text)]',
}

export function Badge({ label, variant }: { label: string; variant: BadgeVariant }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${classes[variant]}`}>
      {label}
    </span>
  )
}
