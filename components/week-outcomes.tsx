"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingAnimation } from "@/components/loading-animation"
import { getWeekOutcomesByProject } from "@/services/week-outcome-service"
import type { WeekOutcome } from "@/types/week-outcome"
import dayjs from "@/lib/dayjs-config"

interface WeekOutcomesProps {
  projectId: string
}

export function WeekOutcomes({ projectId }: WeekOutcomesProps) {
  const [loading, setLoading] = useState(true)
  const [weekOutcomes, setWeekOutcomes] = useState<WeekOutcome[]>([])

  useEffect(() => {
    const fetchWeekOutcomes = async () => {
      try {
        setLoading(true)
        const outcomes = await getWeekOutcomesByProject(projectId)
        setWeekOutcomes(outcomes)
      } catch (error) {
        console.error("Error fetching week outcomes:", error)
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchWeekOutcomes()
    }
  }, [projectId])

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingAnimation />
      </div>
    )
  }

  if (weekOutcomes.length === 0) {
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
        {weekOutcomes.map((week) => (
          <Card key={week.id}>
            <CardHeader>
              <CardTitle>Week of {dayjs(week.weekOf).format("MMMM D, YYYY")}</CardTitle>
              <CardDescription>Summary of completed work and deliverables</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Completed Tasks</h3>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {week.completedTasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
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
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {week.deliverables.map((deliverable, index) => (
                      <li key={index}>{deliverable}</li>
                    ))}
                  </ul>
                </div>
                {week.upcomingDeliverables && week.upcomingDeliverables.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Upcoming Deliverables</h3>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {week.upcomingDeliverables.map((deliverable, index) => (
                        <li key={index}>
                          {deliverable.name} (Due: {dayjs(deliverable.dueDate).format("MMM D, YYYY")})
                        </li>
                      ))}
                    </ul>
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
