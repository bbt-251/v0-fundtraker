"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingAnimation } from "@/components/loading-animation"

export default function DocumentsLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not loading and either no user or user is not a Project Owner, redirect
    if (!loading) {
      if (!user) {
        router.push("/login?callbackUrl=/documents")
      } else if (userProfile?.role !== "Project Owner") {
        router.push("/dashboard")
      }
    }
  }, [loading, user, userProfile, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingAnimation />
      </div>
    )
  }

  // If authenticated and is Project Owner, render children
  if (user && userProfile?.role === "Project Owner") {
    return <>{children}</>
  }

  // Return null while redirecting
  return null
}
