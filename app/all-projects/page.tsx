"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ProjectsPage from "@/app/projects/page"

export default function AllProjectsPage() {
  const { userProfile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only Platform Governors should access this page
    if (!loading && userProfile && userProfile.role !== "Platform Governor") {
      router.push("/dashboard")
    }
  }, [loading, userProfile, router])

  // Reuse the existing Projects page component
  return <ProjectsPage />
}
