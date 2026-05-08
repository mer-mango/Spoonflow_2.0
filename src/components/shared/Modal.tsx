import type { ReactNode } from 'react'

type ModalProps = {
  title?: string
  open: boolean
  onClose: () => void
  children: ReactNode
  hideHeader?: boolean
  maxWidthClassName?: string
  contentClassName?: string
}

export function Modal({
  title,
  open,
  onClose,
  children,
  hideHeader = false,
  maxWidthClassName = 'max-w-2xl',
  contentClassName,
}: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={`w-full ${maxWidthClassName} ${
          contentClassName ?? 'rounded-2xl bg-[var(--card)] p-6 shadow-xl'
        }`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {!hideHeader && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl">{title}</h2>
            <button
              type="button"
              aria-label="Close modal"
              className="rounded-full p-2 text-[var(--muted)] hover:bg-black/5"
              onClick={onClose}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
