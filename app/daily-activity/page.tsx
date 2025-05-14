"use client"

import { DailyActivityTracking } from "@/components/daily-activity-tracking"
import { UpcomingDeliverables } from "@/components/upcoming-deliverables"
import { useEffect, useState } from "react"
import { getAnnouncedProjects } from "@/services/project-service"
import type { Project } from "@/types/project"
import { message } from "antd"

export default function DailyActivityPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const fetchedProjects = await getAnnouncedProjects()
        setProjects(fetchedProjects)
      } catch (error: any) {
        message.error(error.message || "Failed to fetch projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Daily Activity Tracking</h1>
      <DailyActivityTracking />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <UpcomingDeliverables projects={projects} />
      )}
    </div>
  )
}
