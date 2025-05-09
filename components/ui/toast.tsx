"use client"

import * as React from "react"
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider as ToastProviderRadix,
  ToastTitle,
  ToastViewport,
  type ToastActionElement,
  type ToastProps,
} from "@/components/ui/toast"

interface ToastContextType {
  toast: ({ ...props }: ToastProps) => void
}

const ToastContext = React.createContext<ToastContextType>({
  toast: () => undefined,
})

const useToast = () => {
  return React.useContext(ToastContext)
}

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    setToasts((prev) => [...prev, { ...props, id: String(Math.random()) }])
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProviderRadix>
        {children}
        {toasts.map((toast) => (
          <Toast key={toast.id}>
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProviderRadix>
    </ToastContext.Provider>
  )
}

export {
  ToastProvider,
  useToast,
  Toast,
  ToastAction,
  ToastClose,
  ToastTitle,
  ToastDescription,
  ToastViewport,
  type ToastProps,
  type ToastActionElement,
}

export { ToastProvider as Toaster }
