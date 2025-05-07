"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingAnimation } from "@/components/loading-animation"

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && userProfile) {
      // Redirect based on user role
      switch (userProfile.role) {
        case "Donor":
          router.push("/donor-dashboard")
          break
        case "Investor":
          router.push("/donor-dashboard") // Investors use the same dashboard as donors for now
          break
        case "Project Owner":
          router.push("/projects")
          break
        case "Project Manager":
          router.push("/project-manager")
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
    }
  }, [userProfile, loading, router])

  if (loading || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <LoadingAnimation />
      <p className="ml-4 text-lg">Redirecting to your dashboard...</p>
    </div>
  )
}
