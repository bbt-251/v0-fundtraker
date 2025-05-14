"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowRight } from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import type { ProjectTask, ProjectActivity, HumanResource, MaterialResource } from "@/types/project"

interface ActivityTasksModalProps {
  isOpen: boolean
  onClose: () => void
  activity: ProjectActivity | null
  projectId: string
  tasks: ProjectTask[]
  humanResources?: HumanResource[]
  materialResources?: MaterialResource[]
}

export function ActivityTasksModal({
  isOpen,
  onClose,
  activity,
  projectId,
  tasks,
  humanResources = [],
  materialResources = [],
}: ActivityTasksModalProps) {
  const [loading, setLoading] = useState(false)
  const [activityTasks, setActivityTasks] = useState<ProjectTask[]>([])

  useEffect(() => {
    if (isOpen && activity) {
      setLoading(true)
      // Filter tasks by activity ID
      const filteredTasks = tasks.filter((task) => task.activityId === activity.id)
      setActivityTasks(filteredTasks)
      setLoading(false)
    }
  }, [isOpen, activity, tasks])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      case "In Progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "Completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "Blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "Postponed":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      default:
        return "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const calculateTaskTotalCost = (task: ProjectTask) => {
    return task.resources.reduce((total, resource) => total + resource.totalCost, 0)
  }

  // Component for displaying resources with a popover
  const ResourcesPopover = ({ task }: { task: ProjectTask }) => {
    const humanResourcesCount = task.resources.filter((r) => r.resourceType === "human").length
    const materialResourcesCount = task.resources.filter((r) => r.resourceType === "material").length

    return (
      <Popover>
        <PopoverTrigger>
          <button
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="View resources"
            title="Click to view all resources"
          >
            <div className="flex items-center">
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                {humanResourcesCount} human
              </span>
              <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
              <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                {materialResourcesCount} material
              </span>
            </div>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <div className="p-4 max-w-sm bg-gray-900 text-white rounded-md">
            {humanResourcesCount > 0 && (
              <>
                <h4 className="font-medium mb-3 text-sm">Human Resources</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {task.resources
                    .filter((r) => r.resourceType === "human")
                    .map((resource, idx) => {
                      const humanResource = humanResources.find((hr) => hr.id === resource.resourceId)
                      return (
                        <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-800 rounded-md">
                          <span className="bg-blue-900/30 text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <div className="font-medium text-sm">{humanResource?.role || "Unknown Role"}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Quantity: {resource.quantity} • Cost: {formatCurrency(resource.dailyCost)}/day
                            </div>
                            <div className="text-xs text-gray-400">Total: {formatCurrency(resource.totalCost)}</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            )}

            {materialResourcesCount > 0 && (
              <>
                <h4 className="font-medium mb-3 text-sm">Material Resources</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {task.resources
                    .filter((r) => r.resourceType === "material")
                    .map((resource, idx) => {
                      const materialResource = materialResources.find((mr) => mr.id === resource.resourceId)
                      return (
                        <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-800 rounded-md">
                          <span className="bg-purple-900/30 text-purple-300 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <div className="font-medium text-sm">{materialResource?.name || "Unknown Material"}</div>
                            <div className="text-sm text-gray-300">{materialResource?.type || "Unknown Type"}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              Quantity: {resource.quantity} • Cost: {formatCurrency(resource.dailyCost)}/day
                            </div>
                            <div className="text-xs text-gray-400">Total: {formatCurrency(resource.totalCost)}</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            )}

            {humanResourcesCount === 0 && materialResourcesCount === 0 && (
              <div className="text-center py-4 text-gray-400">No resources assigned to this task</div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="text-right font-medium">Total cost: {formatCurrency(calculateTaskTotalCost(task))}</div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tasks for {activity?.name}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : activityTasks.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">
                      <div>{task.name}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(task.status)}>{task.status || "Not Started"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadgeColor(task.priority)}>{task.priority || "Medium"}</Badge>
                    </TableCell>
                    <TableCell>
                      {task.multipleRanges ? (
                        <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">See periods</span>
                      ) : (
                        formatDate(task.startDate)
                      )}
                    </TableCell>
                    <TableCell>
                      {task.multipleRanges ? (
                        <span className="text-blue-600 dark:text-blue-400 underline cursor-pointer">See periods</span>
                      ) : (
                        formatDate(task.endDate)
                      )}
                    </TableCell>
                    <TableCell>{task.duration} days</TableCell>
                    <TableCell>
                      <ResourcesPopover task={task} />
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(calculateTaskTotalCost(task))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks found for this activity. Add tasks to get started.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
