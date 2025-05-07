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
  FileText,
  DollarSign,
  BarChart3,
  FolderKanban,
  Wallet,
  CheckCircle,
  User,
} from "lucide-react"

interface SidebarNavProps {
  className?: string
  items: {
    title: string
    href: string
    icon: string
  }[]
}

export function SidebarNav({ className, items = [] }: SidebarNavProps) {
  const pathname = usePathname()

  // Map icon names to actual components
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
      Search: <Search className="h-5 w-5" />,
      Heart: <Heart className="h-5 w-5" />,
      Settings: <Settings className="h-5 w-5" />,
      Users: <Users className="h-5 w-5" />,
      FileText: <FileText className="h-5 w-5" />,
      DollarSign: <DollarSign className="h-5 w-5" />,
      BarChart3: <BarChart3 className="h-5 w-5" />,
      FolderKanban: <FolderKanban className="h-5 w-5" />,
      Wallet: <Wallet className="h-5 w-5" />,
      CheckCircle: <CheckCircle className="h-5 w-5" />,
      User: <User className="h-5 w-5" />,
    }
    return icons[iconName] || <LayoutDashboard className="h-5 w-5" />
  }

  return (
    <nav className={`space-y-1 ${className}`}>
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
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
        )
      })}
    </nav>
  )
}
