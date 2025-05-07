import type React from "react"
import { SidebarNav } from "@/components/sidebar-nav"
import { AuthWrapper } from "@/components/auth-wrapper"
import { AppHeader } from "@/components/app-header"

export default function DonatedProjectsLayout({ children }: { children: React.ReactNode }) {
  // Define navigation items for donor dashboard
  const donorNavItems = [
    {
      title: "Dashboard",
      href: "/donor-dashboard",
      icon: "LayoutDashboard",
    },
    {
      title: "Browse Projects",
      href: "/donor-dashboard",
      icon: "Search",
    },
    {
      title: "My Donations",
      href: "/donated-projects",
      icon: "Heart",
    },
    {
      title: "Account",
      href: "/account",
      icon: "Settings",
    },
  ]

  return (
    <AuthWrapper>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <div className="flex flex-1">
          <SidebarNav items={donorNavItems} className="w-64 border-r p-4 hidden md:block" />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
    </AuthWrapper>
  )
}
