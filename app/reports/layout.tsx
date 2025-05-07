import type React from "react"
import { AppHeader } from "@/components/app-header"
import { SidebarNav } from "@/components/sidebar-nav"

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sidebarNavItems = [
    {
      title: "Projects",
      href: "/projects",
      icon: "FolderKanban",
    },
    {
      title: "Funds",
      href: "/funds",
      icon: "DollarSign",
    },
    {
      title: "Disbursements",
      href: "/disbursements",
      icon: "Wallet",
    },
    {
      title: "Reports",
      href: "/reports",
      icon: "BarChart",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <div className="flex-1 items-start md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
        <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <main className="flex w-full flex-col overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
