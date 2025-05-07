import type React from "react"
import { AppHeader } from "@/components/app-header"

export default function EditProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
        <main className="flex w-full flex-col overflow-hidden">{children}</main>
    </div>
  )
}
