import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type ToastItem = { id: number; message: string }
type ToastContextValue = { notify: (message: string) => void }
const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const notify = useCallback((message: string) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }, [])

  const value = useMemo(() => ({ notify }), [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-24 right-4 z-[60] flex w-[320px] flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="rounded-xl bg-[var(--text)] px-4 py-3 text-sm text-white shadow-lg">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
