import type React from "react"
import { AppLayout } from "@/components/app-layout"

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppLayout>{children}</AppLayout>
}
