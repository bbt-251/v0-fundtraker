"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import { SidebarNav } from "@/components/sidebar-nav"
import { VerificationBanner } from "@/components/verification-banner"
import { LoadingAnimation } from "@/components/loading-animation"
import { Suspense } from "react"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Handle redirect if not authenticated
  useEffect(() => {
    if (isMounted && !loading && !user) {
      router.push("/login")
    }
  }, [isMounted, loading, user, router])

  // Don't render anything during server-side rendering
  if (!isMounted) {
    return null
  }

  // Show loading animation while checking auth state
  if (loading) {
    return <LoadingAnimation />
  }

  // If not authenticated, don't render the dashboard layout
  if (!user) {
    return null // We'll redirect in the useEffect
  }

  // Get navigation items based on user role
  const navItems = getNavItems(userProfile?.role)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:bg-white lg:dark:bg-gray-800">
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="mr-2 flex h-8 w-8 items-center justify-center rounded bg-blue-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
            </div>
            <span className="text-lg font-bold dark:text-white">FundTracker</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav items={navItems} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <AppHeader />

        {/* Verification banner */}
        <VerificationBanner />

        {/* Main content */}
        <main className="flex-1 pb-8">
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-64">
                <LoadingAnimation />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

// Helper function to get navigation items based on user role
function getNavItems(role?: string) {
  const baseItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
    },
    {
      title: "Account",
      href: "/account",
      icon: "User",
    },
  ]

  // Role-specific items
  if (role === "Donor" || role === "Investor") {
    return [
      ...baseItems,
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
    ]
  } else if (role === "Project Owner") {
    return [
      ...baseItems,
      {
        title: "Projects",
        href: "/projects",
        icon: "FolderKanban",
      },
      {
        title: "Funds",
        href: "/funds",
        icon: "Wallet",
      },
      {
        title: "Disbursements",
        href: "/disbursements",
        icon: "DollarSign",
      },
      {
        title: "Reports",
        href: "/reports",
        icon: "FileText",
      },
    ]
  } else if (role === "Platform Governor") {
    return [
      ...baseItems,
      {
        title: "Project Approvals",
        href: "/project-approvals",
        icon: "CheckCircle",
      },
      {
        title: "Projects",
        href: "/projects",
        icon: "FolderKanban",
      },
      {
        title: "Users",
        href: "/users",
        icon: "Users",
      },
      {
        title: "Reports",
        href: "/reports",
        icon: "BarChart3",
      },
    ]
  } else if (role === "Fund Custodian") {
    return [
      ...baseItems,
      {
        title: "Fund Management",
        href: "/fund-custodian",
        icon: "Wallet",
      },
      {
        title: "Disbursements",
        href: "/disbursements",
        icon: "FileText",
      },
      {
        title: "Reports",
        href: "/reports",
        icon: "BarChart3",
      },
    ]
  }

  // Default items if role is not recognized
  return baseItems
}
