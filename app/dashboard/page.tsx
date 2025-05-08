"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoadingAnimation } from "@/components/loading-animation"

// Import the different dashboard components
import ProjectOwnerDashboard from "@/components/dashboards/project-owner-dashboard"
import PlatformGovernorDashboard from "@/components/dashboards/platform-governor-dashboard"
import DonorDashboard from "@/app/donor-dashboard/page"

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If user is a Fund Custodian, redirect to fund-custodian page
    if (!loading && userProfile?.role === "Fund Custodian") {
      router.push("/fund-custodian")
    }
  }, [loading, userProfile, router])

  if (loading) {
    return <LoadingAnimation />
  }

  if (!user || !userProfile) {
    return null // Will be redirected by auth context
  }

  // Render different dashboard based on user role
  switch (userProfile.role) {
    case "Project Owner":
      return <ProjectOwnerDashboard />
    case "Platform Governor":
      return <PlatformGovernorDashboard />
    case "Donor":
      return <DonorDashboard />
    default:
      return <div>Unknown role</div>
  }
}
