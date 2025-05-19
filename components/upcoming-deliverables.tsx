"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, MoreHorizontal, Info, CalendarRange } from "lucide-react"
import { format, isAfter, isBefore, addMonths } from "date-fns"
import type { Project, ProjectDeliverable } from "@/types/project"
import { Button as AntButton, Tooltip } from "antd"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface UpcomingDeliverablesProps {
  projects: Project[]
  selectedDate?: Date
}

export function UpcomingDeliverables({ projects, selectedDate = new Date() }: UpcomingDeliverablesProps) {
  const [upcomingDeliverables, setUpcomingDeliverables] = useState<
    Array<ProjectDeliverable & { projectName: string; projectId: string }>
  >([])

  const [openTaskModal, setOpenTaskModal] = useState<{
    type: "dependent" | "blocked"
    deliverableId: string | null
  }>({ type: "dependent", deliverableId: null })

  // Calculate the end date (1 month from the selected date) using useMemo to prevent unnecessary recalculations
  const endDate = useMemo(() => addMonths(selectedDate, 1), [selectedDate])

  useEffect(() => {
    // Get all deliverables from all projects
    const allDeliverables = projects.flatMap((project) =>
      (project.deliverables || []).map((deliverable) => ({
        ...deliverable,
        projectName: project.name,
        projectId: project.id,
      })),
    )

    // Filter for upcoming deliverables (due between selected date and 1 month later)
    const upcoming = allDeliverables
      .filter((deliverable) => {
        if (!deliverable.deadline) return false

        try {
          const dueDate = new Date(deliverable.deadline)

          // Check if the due date is after or equal to the selected date
          // AND before or equal to the end date (selected date + 1 month)
          const isInDateRange =
            (isAfter(dueDate, selectedDate) || dueDate.getTime() === selectedDate.getTime()) &&
            (isBefore(dueDate, endDate) || dueDate.getTime() === endDate.getTime())

          return isInDateRange
        } catch (error) {
          console.error("Error parsing date for deliverable:", deliverable.name, error)
          return false
        }
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

    // Only update state if the filtered deliverables have changed
    setUpcomingDeliverables((prev) => {
      const isSame = prev.length === upcoming.length && prev.every((item, index) => item.id === upcoming[index].id)

      return isSame ? prev : upcoming
    })
  }, [projects, selectedDate, endDate])

  // Function to find dependent and blocked tasks for a deliverable
  const findRelatedTasks = (deliverable: ProjectDeliverable & { projectName: string; projectId: string }) => {
    const project = projects.find((p) => p.id === deliverable.projectId)
    if (!project) return { dependentTasks: [], blockedTasks: [] }

    const dependentActivityIds = deliverable.dependentActivities || []
    const dependentActivities = (project.activities || []).filter((activity) =>
      dependentActivityIds.includes(activity.id),
    )

    // Ensure allProjectTasks is an array
    const allProjectTasks = Array.isArray(project.tasks) ? project.tasks : []

    // Now we can safely use filter
    const dependentTasks = allProjectTasks.filter((task) =>
      dependentActivities.some((activity) => activity.tasks?.includes(task.id) || task.activityId === activity.id),
    )

    const blockedTasks = dependentTasks.filter((task) => task.status === "Blocked")

    return {
      dependentTasks: dependentTasks.map((task) => ({ ...task, projectName: project.name })),
      blockedTasks: blockedTasks.map((task) => ({ ...task, projectName: project.name })),
    }
  }

  // Function to get activity names for a deliverable
  const getActivityNames = (deliverable: ProjectDeliverable & { projectId: string }) => {
    if (!deliverable.dependentActivities || deliverable.dependentActivities.length === 0) {
      return []
    }

    const project = projects.find((p) => p.id === deliverable.projectId)
    if (!project) return []

    const projectActivities = project.activities || []

    return deliverable.dependentActivities
      .map((activityId) => {
        const activity = projectActivities.find((a) => a.id === activityId)
        return activity ? activity.name : null
      })
      .filter(Boolean) as string[]
  }

  // Function to format success criteria
  const formatSuccessCriteria = (criteria: string[] | undefined) => {
    if (!criteria || criteria.length === 0) {
      return []
    }
    return criteria
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <CardTitle className="text-2xl font-bold">Upcoming Deliverables</CardTitle>
            <CardDescription>Track deliverables due in the coming days</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1 mt-2 sm:mt-0">
            <CalendarRange className="h-4 w-4 mr-1" />
            {format(selectedDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Deliverable</th>
                <th className="text-left py-3 px-4 font-medium">Due Date</th>
                <th className="text-left py-3 px-4 font-medium">Dependent Activities</th>
                <th className="text-left py-3 px-4 font-medium">Success Criteria</th>
                <th className="text-left py-3 px-4 font-medium">Dependent Tasks</th>
                <th className="text-left py-3 px-4 font-medium">Blocked Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {upcomingDeliverables.length > 0 ? (
                upcomingDeliverables.map((deliverable) => {
                  const { dependentTasks, blockedTasks } = findRelatedTasks(deliverable)
                  const activityNames = getActivityNames(deliverable)
                  const successCriteria = formatSuccessCriteria(deliverable.successCriteria)

                  return (
                    <tr key={deliverable.id} className="hover:bg-muted/50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium">{deliverable.name}</div>
                          <div className="text-sm text-muted-foreground">{deliverable.projectName}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {format(new Date(deliverable.deadline), "MMM d, yyyy")}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {activityNames.length > 0 ? (
                          <div className="flex items-center">
                            <span className="mr-1">
                              {activityNames.length > 2
                                ? `${activityNames.slice(0, 2).join(", ")} +${activityNames.length - 2} more`
                                : activityNames.join(", ")}
                            </span>
                            {activityNames.length > 2 && (
                              <Tooltip
                                title={
                                  <ul className="list-disc pl-4 py-1">
                                    {activityNames.map((name, i) => (
                                      <li key={i}>{name}</li>
                                    ))}
                                  </ul>
                                }
                              >
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {successCriteria.length > 0 ? (
                          <div className="flex items-center">
                            <span className="mr-1">
                              {successCriteria.length > 2
                                ? `${successCriteria.slice(0, 2).join(", ")} +${successCriteria.length - 2} more`
                                : successCriteria.join(", ")}
                            </span>
                            {successCriteria.length > 2 && (
                              <Tooltip
                                title={
                                  <ul className="list-disc pl-4 py-1">
                                    {successCriteria.map((criteria, i) => (
                                      <li key={i}>{criteria}</li>
                                    ))}
                                  </ul>
                                }
                              >
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </Tooltip>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <AntButton
                          type="primary"
                          size="small"
                          icon={<MoreHorizontal className="h-4 w-4" />}
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                          onClick={() => setOpenTaskModal({ type: "dependent", deliverableId: deliverable.id })}
                        >
                          View
                        </AntButton>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <AntButton
                          type="primary"
                          size="small"
                          icon={<MoreHorizontal className="h-4 w-4" />}
                          className="flex items-center justify-center bg-blue-500 hover:bg-blue-600"
                          onClick={() => setOpenTaskModal({ type: "blocked", deliverableId: deliverable.id })}
                        >
                          View
                        </AntButton>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No deliverables due between {format(selectedDate, "MMM d, yyyy")} and{" "}
                    {format(endDate, "MMM d, yyyy")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
      {/* Task Modal */}
      <Dialog
        open={openTaskModal.deliverableId !== null}
        onOpenChange={() => setOpenTaskModal({ type: "dependent", deliverableId: null })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{openTaskModal.type === "dependent" ? "Dependent Tasks" : "Blocked Tasks"}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto py-4">
            {openTaskModal.deliverableId &&
              (() => {
                const deliverable = upcomingDeliverables.find((d) => d.id === openTaskModal.deliverableId)
                if (!deliverable) return <p className="text-sm text-muted-foreground">No tasks found</p>

                const { dependentTasks, blockedTasks } = findRelatedTasks(deliverable)
                const tasksToShow = openTaskModal.type === "dependent" ? dependentTasks : blockedTasks

                return tasksToShow.length > 0 ? (
                  <ul className="space-y-4">
                    {tasksToShow.map((task) => (
                      <li key={task.id} className="border-b pb-4">
                        <div className="font-medium text-lg">{task.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">Status: {task.status}</div>
                        <div className="text-sm text-muted-foreground">Project: {task.projectName}</div>
                        {task.description && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">Description:</span> {task.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No {openTaskModal.type === "dependent" ? "dependent" : "blocked"} tasks found
                  </p>
                )
              })()}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
