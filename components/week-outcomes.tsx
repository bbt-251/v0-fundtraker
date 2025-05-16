"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingAnimation } from "@/components/loading-animation"
import dayjs from "@/lib/dayjs-config"
import { getProjectById } from "@/services/project-service"
import { getTasks } from "@/services/task-service"

interface WeekOutcomesProps {
  projectId: string
}

interface WeekData {
  weekNumber: number
  weekOf: string
  completedTasks: string[]
  activityCompletionRate: number
  activitiesCompleted: number
  activitiesPlanned: number
  deliverables: string[]
  upcomingDeliverables: { name: string; dueDate: string }[]
}

export function WeekOutcomes({ projectId }: WeekOutcomesProps) {
  const [loading, setLoading] = useState(true)
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [currentWeek, setCurrentWeek] = useState<number>(dayjs().week())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!projectId) return

      try {
        setLoading(true)
        setError(null)

        // Get the current week, previous week, and next week
        const currentWeekNumber = dayjs().week()
        const previousWeekNumber = currentWeekNumber - 1
        const nextWeekNumber = currentWeekNumber + 1

        // Get start dates for each week
        const currentWeekStart = dayjs().week(currentWeekNumber).startOf("week")
        const previousWeekStart = dayjs().week(previousWeekNumber).startOf("week")
        const nextWeekStart = dayjs().week(nextWeekNumber).startOf("week")

        // Get end dates for each week
        const currentWeekEnd = currentWeekStart.clone().endOf("week")
        const previousWeekEnd = previousWeekStart.clone().endOf("week")
        const nextWeekEnd = nextWeekStart.clone().endOf("week")

        // Fetch project data
        const project = await getProjectById(projectId)
        if (!project) {
          setError("Project not found")
          setLoading(false)
          return
        }

        // Extract activities and deliverables from project
        const activities = project.planning?.activities || []
        const deliverables = project.planning?.deliverables || []

        // Fetch all tasks for the project
        const tasks = await getTasks(projectId)

        // Process data for previous week
        const previousWeekTasks = tasks.filter((task) => {
          const completionDate = dayjs(task.completionDate)
          return task.completed && completionDate.isAfter(previousWeekStart) && completionDate.isBefore(previousWeekEnd)
        })

        const previousWeekDeliverables = deliverables.filter((deliverable) => {
          const dueDate = dayjs(deliverable.dueDate)
          return deliverable.completed && dueDate.isAfter(previousWeekStart) && dueDate.isBefore(previousWeekEnd)
        })

        // Process data for current week
        const currentWeekTasks = tasks.filter((task) => {
          const completionDate = dayjs(task.completionDate)
          return task.completed && completionDate.isAfter(currentWeekStart) && completionDate.isBefore(currentWeekEnd)
        })

        const currentWeekDeliverables = deliverables.filter((deliverable) => {
          const dueDate = dayjs(deliverable.dueDate)
          return deliverable.completed && dueDate.isAfter(currentWeekStart) && dueDate.isBefore(currentWeekEnd)
        })

        const upcomingDeliverables = deliverables.filter((deliverable) => {
          const dueDate = dayjs(deliverable.dueDate)
          return !deliverable.completed && dueDate.isAfter(nextWeekStart) && dueDate.isBefore(nextWeekEnd)
        })

        // Calculate activity completion rates
        const calculateActivityStats = (weekTasks: any[]) => {
          const activityTaskCounts: Record<string, { total: number; completed: number }> = {}

          // Group tasks by activity and count completed vs total
          tasks.forEach((task) => {
            if (!task.activityId) return

            if (!activityTaskCounts[task.activityId]) {
              activityTaskCounts[task.activityId] = { total: 0, completed: 0 }
            }

            activityTaskCounts[task.activityId].total++

            if (weekTasks.some((wt) => wt.id === task.id)) {
              activityTaskCounts[task.activityId].completed++
            }
          })

          // Calculate how many activities have at least one task completed
          const activitiesWithCompletedTasks = Object.values(activityTaskCounts).filter(
            (counts) => counts.completed > 0,
          ).length

          // Calculate overall completion rate
          const totalTasks = Object.values(activityTaskCounts).reduce((sum, counts) => sum + counts.total, 0)
          const completedTasks = Object.values(activityTaskCounts).reduce((sum, counts) => sum + counts.completed, 0)

          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          return {
            activitiesCompleted: activitiesWithCompletedTasks,
            activitiesPlanned: Object.keys(activityTaskCounts).length,
            activityCompletionRate: completionRate,
          }
        }

        const previousWeekStats = calculateActivityStats(previousWeekTasks)
        const currentWeekStats = calculateActivityStats(currentWeekTasks)

        // Create week data objects
        const weeks: WeekData[] = [
          {
            weekNumber: previousWeekNumber,
            weekOf: previousWeekStart.format("YYYY-MM-DD"),
            completedTasks: previousWeekTasks.map((task) => `${task.name} (${task.wbsCode || "No WBS"})`),
            ...previousWeekStats,
            deliverables: previousWeekDeliverables.map((d) => d.name),
            upcomingDeliverables: currentWeekDeliverables.map((d) => ({
              name: d.name,
              dueDate: d.dueDate,
            })),
          },
          {
            weekNumber: currentWeekNumber,
            weekOf: currentWeekStart.format("YYYY-MM-DD"),
            completedTasks: currentWeekTasks.map((task) => `${task.name} (${task.wbsCode || "No WBS"})`),
            ...currentWeekStats,
            deliverables: currentWeekDeliverables.map((d) => d.name),
            upcomingDeliverables: upcomingDeliverables.map((d) => ({
              name: d.name,
              dueDate: d.dueDate,
            })),
          },
          {
            weekNumber: nextWeekNumber,
            weekOf: nextWeekStart.format("YYYY-MM-DD"),
            completedTasks: [],
            activityCompletionRate: 0,
            activitiesCompleted: 0,
            activitiesPlanned: activities.filter((a) => {
              const startDate = dayjs(a.startDate)
              const endDate = dayjs(a.endDate)
              return startDate.isBefore(nextWeekEnd) && endDate.isAfter(nextWeekStart)
            }).length,
            deliverables: [],
            upcomingDeliverables: upcomingDeliverables.map((d) => ({
              name: d.name,
              dueDate: d.dueDate,
            })),
          },
        ]

        setWeekData(weeks)
        setCurrentWeek(currentWeekNumber)
      } catch (error) {
        console.error("Error fetching project data:", error)
        setError("Failed to load week outcomes data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingAnimation />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (weekData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No weekly outcomes available for this project.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Week Outcomes</h2>
          <p className="text-sm text-muted-foreground">Summary of completed work and deliverables</p>
        </div>
      </div>
      <div className="grid gap-6 mt-4">
        {weekData.map((week) => (
          <Card key={week.weekNumber} className={week.weekNumber === currentWeek ? "border-2 border-primary" : ""}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Week of {dayjs(week.weekOf).format("MMMM D, YYYY")}</CardTitle>
                  <CardDescription>
                    {week.weekNumber < currentWeek
                      ? "Previous week's outcomes"
                      : week.weekNumber > currentWeek
                        ? "Upcoming week's planned work"
                        : "Current week's outcomes"}
                  </CardDescription>
                </div>
                {week.weekNumber === currentWeek && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Current Week</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {week.weekNumber <= currentWeek && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Completed Tasks</h3>
                      {week.completedTasks.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {week.completedTasks.map((task, index) => (
                            <li key={index}>{task}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No completed tasks for this week.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium mb-1">Activity Completion Rate</h3>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${week.activityCompletionRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{week.activityCompletionRate}%</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {week.activitiesCompleted} of {week.activitiesPlanned} planned activities completed
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Deliverables</h3>
                      {week.deliverables.length > 0 ? (
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {week.deliverables.map((deliverable, index) => (
                            <li key={index}>{deliverable}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No deliverables completed this week.</p>
                      )}
                    </div>
                  </>
                )}

                {week.weekNumber >= currentWeek && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">
                      {week.weekNumber === currentWeek ? "Upcoming Deliverables" : "Planned Deliverables"}
                    </h3>
                    {week.upcomingDeliverables.length > 0 ? (
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {week.upcomingDeliverables.map((deliverable, index) => (
                          <li key={index}>
                            {deliverable.name} (Due: {dayjs(deliverable.dueDate).format("MMM D, YYYY")})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No {week.weekNumber === currentWeek ? "upcoming" : "planned"} deliverables.
                      </p>
                    )}
                  </div>
                )}

                {week.weekNumber > currentWeek && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Planned Activities</h3>
                    <p className="text-sm text-muted-foreground">
                      {week.activitiesPlanned} activities planned for next week
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
