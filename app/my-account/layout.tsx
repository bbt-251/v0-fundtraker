import type React from "react"
import { AppLayout } from "@/components/app-layout"

export default function MyAccountLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
