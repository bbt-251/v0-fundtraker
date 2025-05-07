import type React from "react"
import { AppLayout } from "@/components/app-layout"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
