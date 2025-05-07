"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, User, Settings, Shield, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import type { UserRole } from "@/types/user"

interface ProfileDropdownProps {
  email: string | null | undefined
  role?: UserRole
  verified?: boolean
}

export function ProfileDropdown({ email, role, verified }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { signOut } = useAuth()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const toggleDropdown = () => setIsOpen(!isOpen)

  const displayName = email ? email.split("@")[0] : "User"
  const userInitial = displayName.charAt(0).toUpperCase()

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-medium">
          {userInitial}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
          >
            <div className="py-2 px-4 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
              {role && (
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Role:</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {role}
                  </span>
                </div>
              )}
              {verified !== undefined && (
                <div className="mt-1 flex items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">Status:</span>
                  {verified ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 flex items-center">
                      <Shield className="mr-1 h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to profile page or open modal
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <User className="mr-2 h-4 w-4" />
                Your Profile
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to settings page
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  setIsOpen(false)
                  signOut()
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
