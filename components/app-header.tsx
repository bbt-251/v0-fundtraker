"use client"

import { useAuth } from "@/contexts/auth-context"
import { ProfileDropdown } from "./profile-dropdown"
import { ThemeToggle } from "./theme-toggle"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { PlusCircle, Menu, Bell, Search } from "lucide-react"
import { useState } from "react"

export function AppHeader() {
  const { user, userProfile } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white dark:bg-gray-800 px-4 md:px-6">
      <div className="flex items-center gap-2">
        {/* Mobile menu button - visible on small screens */}
        <button
          className="p-2 rounded-md lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <Menu className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </button>

        {/* Mobile menu - visible when toggled on small screens */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 top-16 z-20 bg-white dark:bg-gray-800 lg:hidden">
            <nav className="p-4 space-y-2">
              {getNavItems(userProfile?.role).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {getIcon(item.icon)}
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        )}

        <div className="relative w-64 md:w-96 ml-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
            placeholder="Search"
          />
        </div>
      </div>

      <div className="flex items-center">
        {userProfile?.role === "Project Owner" && (
          <Link
            href="/createNewProject"
            className="hidden md:flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 mr-4"
          >
            <PlusCircle className="h-4 w-4" />
            Create Project
          </Link>
        )}
        <ThemeToggle />
        <button className="ml-4 p-1 rounded-full text-gray-400 dark:text-gray-300 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800">
          <Bell className="h-6 w-6" />
        </button>
        {user && <ProfileDropdown email={user.email} role={userProfile?.role} verified={userProfile?.verified} />}
      </div>
    </header>
  )
}

// Update the getNavItems function to include Daily Activity for Project Owners

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
        title: "Projects",
        href: "/projects",
        icon: "FolderKanban",
      },
      {
        title: "Daily Activity",
        href: "/daily-activity",
        icon: "Calendar",
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
    // No sidebar for Fund Custodian, but we still need header items
    return [
      {
        title: "Fund Management",
        href: "/fund-custodian",
        icon: "Wallet",
      },
      accountItem,
    ]
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

// Helper function to get icon component
function getIcon(iconName: string) {
  // This is a simplified version - in a real app, you'd import and use actual icon components
  return <span className="mr-3 h-5 w-5">{iconName}</span>
}
