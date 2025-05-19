"use client"

import { useState, useEffect, useCallback } from "react"
import { DailyActivityTracking } from "@/components/daily-activity-tracking"
import { UpcomingDeliverables } from "@/components/upcoming-deliverables"
import { BlockersAndDelays } from "@/components/blockers-and-delays"
import { Queries } from "@/components/queries"
import { IssueLog } from "@/components/issue-log"
import { Risks } from "@/components/risks"
import { TeamMeetingNotes } from "@/components/team-meeting-notes"
import { getAnnouncedProjects, getUserProjects } from "@/services/project-service"
import { message } from "antd"
import { LoadingAnimation } from "@/components/loading-animation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WeeklyTabs } from "@/components/weekly-tabs"
import { startOfWeek, endOfWeek } from "date-fns"
import { WeeklyDatePicker } from "@/components/weekly-date-picker"

export default function MonitorAndTrackPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState("daily")
  const { user } = useAuth()
  const [weekStartDate, setWeekStartDate] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weekEndDate, setWeekEndDate] = useState<Date>(endOfWeek(new Date(), { weekStartsOn: 1 }))

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)

        // Get projects created by the current user
        const fetchedUserProjects = await getUserProjects(user?.uid)
        setUserProjects(fetchedUserProjects)

        // Set default selected project if available
        if (fetchedUserProjects.length > 0) {
          setSelectedProjectId(fetchedUserProjects[0].id)
        }

        // Get all announced projects for upcoming deliverables
        const fetchedProjects = await getAnnouncedProjects()
        setProjects(fetchedProjects)
      } catch (error) {
        console.error("Error fetching projects:", error)
        message.error("Failed to load projects")
      } finally {
        setLoading(false)
      }
    }

    if (user?.uid) {
      fetchProjects()
    }
  }, [user])

  // Use useCallback to memoize these handlers to prevent unnecessary re-renders
  const handleDateChange = useCallback((date: Date) => {
    setSelectedDate(date)
  }, [])

  const handleProjectChange = useCallback((projectId: string) => {
    setSelectedProjectId(projectId)
  }, [])

  const handleWeekChange = useCallback((start: Date, end: Date) => {
    setWeekStartDate(start)
    setWeekEndDate(end)
  }, [])

  // Get the selected project name for display
  const selectedProject = userProjects.find((project) => project.id === selectedProjectId)
  const selectedProjectName = selectedProject ? selectedProject.name : "Select a project"

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold">Monitor & Track</h1>

        <div className="w-full md:w-80">
          <Select
            value={selectedProjectId}
            onValueChange={handleProjectChange}
            defaultValue={selectedProjectId || undefined}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {userProjects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingAnimation />
        </div>
      ) : selectedProjectId ? (
        <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-8">
            <DailyActivityTracking
              initialDate={selectedDate}
              onDateChange={handleDateChange}
              projectId={selectedProjectId}
            />
            <UpcomingDeliverables projects={projects} selectedDate={selectedDate} projectId={selectedProjectId} />
            <BlockersAndDelays projectId={selectedProjectId} />
            <Queries projectId={selectedProjectId} />
            <IssueLog projectId={selectedProjectId} />
            <Risks projectId={selectedProjectId} />
          </TabsContent>

          <TabsContent value="weekly" className="space-y-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Weekly Overview</h2>
              <WeeklyDatePicker initialDate={new Date()} onWeekChange={handleWeekChange} />
            </div>
            <TeamMeetingNotes projectId={selectedProjectId} startDate={weekStartDate} endDate={weekEndDate} />
            <WeeklyTabs projectId={selectedProjectId} startDate={weekStartDate} endDate={weekEndDate} />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <p className="text-lg text-gray-500">Please select a project to view monitoring data</p>
        </div>
      )}
    </div>
  )
}
