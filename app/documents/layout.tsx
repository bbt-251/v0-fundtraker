"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingAnimation } from "@/components/loading-animation"

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Redirect if not authenticated and not loading
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation />
      </div>
    )
  }

  // If authenticated, render children
  return user ? <>{children}</> : null
}
