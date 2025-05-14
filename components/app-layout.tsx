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

  // Check if we should hide the sidebar (for Fund Custodian)
  const hideSidebar = userProfile?.role === "Fund Custodian"

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar for desktop - hidden for Fund Custodian */}
      {!hideSidebar && (
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
      )}

      {/* Main content - full width for Fund Custodian */}
      <div className={`${!hideSidebar ? "lg:pl-64" : ""} flex flex-col flex-1`}>
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

// Update the getNavItems function to include Monitor & Track for Project Owners

function getNavItems(role?: string) {
  // Common route for all roles
  const accountItem = {
    title: "My Account",
    href: "/my-account",
    icon: "User",
  }

  // Role-specific items
  if (role === "Donor") {
    return [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
      },
      {
        title: "Donated Projects",
        href: "/donated-projects",
        icon: "Heart",
      },
      accountItem,
    ]
  } else if (role === "Project Owner") {
    return [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
      },
      {
        title: "My Projects",
        href: "/my-projects",
        icon: "FolderKanban",
      },
      {
        title: "Monitor & Track",
        href: "/monitor-and-track",
        icon: "Calendar",
      },
      {
        title: "Team",
        href: "#",
        icon: "Users2",
        children: [
          {
            title: "Team Members",
            href: "/team/members",
          },
          {
            title: "Time Tracking & Leave",
            href: "/team/time-tracking",
          },
        ],
      },
      accountItem,
    ]
  } else if (role === "Platform Governor") {
    return [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: "LayoutDashboard",
      },
      {
        title: "All Projects",
        href: "/all-projects",
        icon: "FolderKanban",
      },
      {
        title: "Users",
        href: "/users",
        icon: "Users",
      },
      accountItem,
    ]
  } else if (role === "Fund Custodian") {
    // No sidebar for Fund Custodian as requested
    return []
  }

  // Default items if role is not recognized
  return [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "LayoutDashboard",
    },
    accountItem,
  ]
}
