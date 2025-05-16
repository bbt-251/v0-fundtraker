"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  Heart,
  Settings,
  Users,
  Users2,
  FileText,
  DollarSign,
  BarChart3,
  FolderKanban,
  Wallet,
  CheckCircle,
  User,
  Calendar,
  ChevronDown,
  ChevronRight,
  File,
} from "lucide-react"
import { useState } from "react"

interface NavItem {
  title: string
  href: string
  icon: string
  children?: {
    title: string
    href: string
  }[]
}

interface SidebarNavProps {
  className?: string
  items: NavItem[]
}

export function SidebarNav({ className, items = [] }: SidebarNavProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Toggle expanded state for items with children
  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }

  // Check if an item or any of its children is active
  const isItemActive = (item: NavItem) => {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return true
    }

    if (item.children) {
      return item.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))
    }

    return false
  }

  // Map icon names to actual components
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
      Search: <Search className="h-5 w-5" />,
      Heart: <Heart className="h-5 w-5" />,
      Settings: <Settings className="h-5 w-5" />,
      Users: <Users className="h-5 w-5" />,
      Users2: <Users2 className="h-5 w-5" />,
      FileText: <FileText className="h-5 w-5" />,
      DollarSign: <DollarSign className="h-5 w-5" />,
      BarChart3: <BarChart3 className="h-5 w-5" />,
      FolderKanban: <FolderKanban className="h-5 w-5" />,
      Wallet: <Wallet className="h-5 w-5" />,
      CheckCircle: <CheckCircle className="h-5 w-5" />,
      User: <User className="h-5 w-5" />,
      Calendar: <Calendar className="h-5 w-5" />,
      File: <File className="h-5 w-5" />,
    }
    return icons[iconName] || <LayoutDashboard className="h-5 w-5" />
  }

  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map((item) => {
        const isActive = isItemActive(item)
        const isExpanded = expandedItems[item.title] || isActive

        return (
          <div key={item.title} className="space-y-1">
            {item.children ? (
              <>
                <button
                  onClick={() => toggleExpanded(item.title)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="mr-3">{getIcon(item.icon)}</span>
                    {item.title}
                  </div>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>

                {isExpanded && (
                  <div className="ml-9 space-y-1 mt-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href || pathname.startsWith(`${child.href}/`)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                            isChildActive
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50"
                          }`}
                        >
                          {child.title}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <span className="mr-3">{getIcon(item.icon)}</span>
                {item.title}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
