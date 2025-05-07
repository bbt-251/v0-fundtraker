"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { LoadingAnimation } from "@/components/loading-animation"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle redirects based on auth state
  useEffect(() => {
    if (!isClient || loading) return

    const pathname = window.location.pathname

    // If user is not authenticated and trying to access protected routes
    if (
      !user &&
      (pathname.startsWith("/dashboard") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/users") ||
        pathname.startsWith("/donor-dashboard") ||
        pathname.startsWith("/donated-projects"))
    ) {
      router.push("/login")
    }

    // If user is authenticated and on auth pages, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
      router.push("/dashboard")
    }
  }, [user, loading, router, isClient])

  // Don't render anything on the server
  if (!isClient) {
    return null
  }

  // Show loading animation while checking auth state
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  return <>{children}</>
}
