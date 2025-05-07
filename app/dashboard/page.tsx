"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingAnimation } from "@/components/loading-animation"
import { ProjectManagerDashboard } from "@/components/project-manager-dashboard"

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
        return
      }

      // Only redirect non-Project Owners to their specific dashboards
      if (userProfile && userProfile.role !== "Project Owner") {
        switch (userProfile.role) {
          case "Donor":
          case "Investor":
            router.push("/donor-dashboard")
            break
          case "Platform Governor":
            router.push("/projects")
            break
          case "Fund Custodian":
            router.push("/fund-custodian")
            break
          default:
            // Default dashboard for other roles
            router.push("/projects")
        }
      } else {
        // For Project Owners, we'll show the dashboard directly here
        setIsLoaded(true)
      }
    }
  }, [userProfile, loading, router, user])

  if (loading || !isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  // Project Manager Dashboard is shown directly on /dashboard for Project Owners
  return <ProjectManagerDashboard />
}
