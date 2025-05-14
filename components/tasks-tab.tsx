"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Trash2, Plus, Loader2, ArrowRight, MoreHorizontal, Clock, CheckCircle, Play, Ban } from "lucide-react"
import {
  addProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProject,
  addTaskResourceAssignment,
  deleteTaskResourceAssignment,
} from "@/services/project-service"
import type { ProjectActivity, ProjectTask, HumanResource, MaterialResource } from "@/types/project"
import { format } from "date-fns"
import { DateRangePicker, type MultiDateRange, type DateRange } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"

interface TasksTabProps {
  projectId: string
}

export function TasksTab({ projectId }: TasksTabProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [humanResources, setHumanResources] = useState<HumanResource[]>([])
  const [materialResources, setMaterialResources] = useState<MaterialResource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Task form state
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [selectedActivityId, setSelectedActivityId] = useState("")
  const [taskDateRange, setTaskDateRange] = useState<DateRange | undefined>()
  const [useMultipleTaskDates, setUseMultipleTaskDates] = useState(false)
  const [taskMultiDateRange, setTaskMultiDateRange] = useState<MultiDateRange>({
    ranges: [{ from: undefined, to: undefined }],
  })
  const [isEditing, setIsEditing] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [taskPriority, setTaskPriority] = useState<"Low" | "Medium" | "High">("Medium")

  // Resource assignment form state
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [selectedResourceType, setSelectedResourceType] = useState<"human" | "material">("human")
  const [selectedResourceId, setSelectedResourceId] = useState("")
  const [resourceQuantity, setResourceQuantity] = useState("1")
  const [resourceDateRange, setResourceDateRange] = useState<DateRange | undefined>()
  const [useMultipleResourceDates, setUseMultipleResourceDates] = useState(false)
  const [resourceMultiDateRange, setResourceMultiDateRange] = useState<MultiDateRange>({
    ranges: [{ from: undefined, to: undefined }],
  })

  // Status change modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusChangeType, setStatusChangeType] = useState<"block" | "postpone" | null>(null)
  const [statusReason, setStatusReason] = useState("")
  const [taskToChangeStatus, setTaskToChangeStatus] = useState<string | null>(null)

  // Fetch project data when component mounts
  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      const project = await getProject(projectId)
      setActivities(project.activities || [])
      setTasks(project.tasks || [])
      setHumanResources(project.humanResources || [])
      setMaterialResources(project.materialResources || [])
    } catch (error: any) {
      setError(error.message || "Failed to fetch project data")
    } finally {
      setLoading(false)
    }
  }

  // Calculate duration in days between two dates
  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)

    // Reset hours to ensure we're only counting days
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)

    // Calculate the difference in milliseconds
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())

    // Convert to days and add 1 to include both start and end dates
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1

    return diffDays
  }

  // Calculate resource cost
  const calculateResourceCost = (
    resourceType: "human" | "material",
    resourceId: string,
    quantity: number,
    startDate: string,
    endDate: string,
  ) => {
    const duration = calculateDuration(startDate, endDate)

    if (resourceType === "human") {
      const resource = humanResources.find((r) => r.id === resourceId)
      if (!resource) return { dailyCost: 0, totalCost: 0 }
      const dailyCost = resource.costPerDay
      return {
        dailyCost,
        totalCost: dailyCost * quantity * duration,
      }
    } else {
      const resource = materialResources.find((r) => r.id === resourceId)
      if (!resource) return { dailyCost: 0, totalCost: 0 }

      if (resource.costType === "one-time") {
        return {
          dailyCost: resource.costAmount / duration,
          totalCost: resource.costAmount * quantity,
        }
      } else {
        const dailyCost = resource.costAmount / resource.amortizationPeriod
        return {
          dailyCost,
          totalCost: dailyCost * quantity * duration,
        }
      }
    }
  }

  const handleAddTask = async () => {
    if (!taskName.trim()) {
      setError("Task name is required")
      return
    }

    if (!selectedActivityId) {
      setError("Please select an activity")
      return
    }

    // Validate date ranges
    if (useMultipleTaskDates) {
      if (
        !taskMultiDateRange ||
        !taskMultiDateRange.ranges.length ||
        !taskMultiDateRange.ranges.some((range) => range.from && range.to)
      ) {
        setError("At least one complete date range is required")
        return
      }
    } else {
      if (!taskDateRange?.from || !taskDateRange?.to) {
        setError("Start and end dates are required")
        return
      }
    }

    try {
      setLoading(true)
      setError("")

      let startDate: string
      let endDate: string
      let duration: number
      let dateRanges: { startDate: string; endDate: string }[] | undefined

      if (useMultipleTaskDates && taskMultiDateRange) {
        // Process multiple date ranges
        dateRanges = taskMultiDateRange.ranges
          .filter((range) => range.from && range.to)
          .map((range) => ({
            startDate: format(range.from!, "yyyy-MM-dd"),
            endDate: format(range.to!, "yyyy-MM-dd"),
          }))

        // Set overall start/end dates
        const allDates = dateRanges.flatMap((range) => [new Date(range.startDate), new Date(range.endDate)])
        const minDate = new Date(Math.min(...allDates.map((date) => date.getTime())))
        const maxDate = new Date(Math.max(...allDates.map((date) => date.getTime())))

        startDate = format(minDate, "yyyy-MM-dd")
        endDate = format(maxDate, "yyyy-MM-dd")

        // Calculate total duration (excluding weekends if necessary)
        duration = dateRanges.reduce((total, range) => {
          return total + calculateDuration(range.startDate, range.endDate)
        }, 0)
      } else {
        // Single date range
        startDate = format(taskDateRange!.from!, "yyyy-MM-dd")
        endDate = format(taskDateRange!.to!, "yyyy-MM-dd")
        duration = calculateDuration(startDate, endDate)
        dateRanges = undefined
      }

      if (isEditing && currentTaskId) {
        // Update existing task
        const updatedTask = await updateProjectTask(projectId, currentTaskId, {
          name: taskName,
          description: taskDescription,
          activityId: selectedActivityId,
          startDate,
          endDate,
          duration,
          dateRanges,
          multipleRanges: useMultipleTaskDates,
          priority: taskPriority || "Medium", // Ensure priority is never undefined
          // Only include status if it's being explicitly changed
          status: "Not Started",
        })

        // Update local state
        setTasks(tasks.map((task) => (task.id === currentTaskId ? updatedTask : task)))
      } else {
        // Add new task
        const newTask = await addProjectTask(projectId, {
          name: taskName,
          description: taskDescription,
          activityId: selectedActivityId,
          startDate,
          endDate,
          duration,
          dateRanges,
          multipleRanges: useMultipleTaskDates,
          status: "Not Started", // Default status
          priority: taskPriority || "Medium", // Default priority
        })

        // Update local state
        setTasks([...tasks, newTask])
      }

      // Reset form
      setTaskName("")
      setTaskDescription("")
      setSelectedActivityId("")
      setTaskDateRange(undefined)
      setTaskMultiDateRange({ ranges: [{ from: undefined, to: undefined }] })
      setUseMultipleTaskDates(false)
      setIsEditing(false)
      setCurrentTaskId(null)
      setTaskPriority("Medium")
    } catch (error: any) {
      setError(error.message || "Failed to save task")
    } finally {
      setLoading(false)
    }
  }

  const handleEditTask = (task: ProjectTask) => {
    setTaskName(task.name)
    setTaskDescription(task.description)
    setSelectedActivityId(task.activityId)
    setTaskPriority(task.priority || "Medium")

    if (task.multipleRanges && task.dateRanges && task.dateRanges.length > 0) {
      setUseMultipleTaskDates(true)

      const ranges = task.dateRanges.map((range) => ({
        from: new Date(range.startDate),
        to: new Date(range.endDate),
      }))

      setTaskMultiDateRange({ ranges })
    } else {
      setUseMultipleTaskDates(false)
      setTaskDateRange({
        from: new Date(task.startDate),
        to: new Date(task.endDate),
      })
    }

    setIsEditing(true)
    setCurrentTaskId(task.id)
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      setLoading(true)
      await deleteProjectTask(projectId, taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to delete task")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignResource = async () => {
    if (!selectedTaskId) {
      setError("Please select a task")
      return
    }

    if (!selectedResourceId) {
      setError("Please select a resource")
      return
    }

    // Validate date ranges
    if (useMultipleResourceDates) {
      if (
        !resourceMultiDateRange ||
        !resourceMultiDateRange.ranges.length ||
        !resourceMultiDateRange.ranges.some((range) => range.from && range.to)
      ) {
        setError("At least one complete date range is required")
        return
      }
    } else {
      if (!resourceDateRange?.from || !resourceDateRange?.to) {
        setError("Start and end dates are required")
        return
      }
    }

    // Validate that resource dates are within task dates
    const selectedTask = tasks.find((t) => t.id === selectedTaskId)
    if (selectedTask) {
      const taskStart = new Date(selectedTask.startDate)
      const taskEnd = new Date(selectedTask.endDate)

      // Reset hours to ensure proper comparison
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)

      if (useMultipleResourceDates) {
        // Check all resource date ranges are within task dates
        const allRangesValid = resourceMultiDateRange.ranges.every((range) => {
          if (!range.from || !range.to) return true // Skip incomplete ranges

          const resourceStart = new Date(range.from)
          const resourceEnd = new Date(range.to)

          resourceStart.setHours(0, 0, 0, 0)
          resourceEnd.setHours(0, 0, 0, 0)

          return resourceStart >= taskStart && resourceEnd <= taskEnd
        })

        if (!allRangesValid) {
          setError("All resource date ranges must be within the task's date range")
          return
        }
      } else {
        const resourceStart = new Date(resourceDateRange!.from!)
        const resourceEnd = new Date(resourceDateRange!.to!)

        resourceStart.setHours(0, 0, 0, 0)
        resourceEnd.setHours(0, 0, 0, 0)

        if (resourceStart < taskStart || resourceEnd > taskEnd) {
          setError("Resource dates must be within the task's date range")
          return
        }
      }
    }

    try {
      setLoading(true)
      setError("")

      let startDate: string
      let endDate: string
      let duration: number
      const quantity = Number.parseInt(resourceQuantity, 10) || 1
      let dateRanges: { startDate: string; endDate: string }[] | undefined
      let dailyCost: number
      let totalCost: number

      if (useMultipleResourceDates && resourceMultiDateRange) {
        // Process multiple date ranges
        dateRanges = resourceMultiDateRange.ranges
          .filter((range) => range.from && range.to)
          .map((range) => ({
            startDate: format(range.from!, "yyyy-MM-dd"),
            endDate: format(range.to!, "yyyy-MM-dd"),
          }))

        // Set overall start/end dates
        const allDates = dateRanges.flatMap((range) => [new Date(range.startDate), new Date(range.endDate)])
        const minDate = new Date(Math.min(...allDates.map((date) => date.getTime())))
        const maxDate = new Date(Math.max(...allDates.map((date) => date.getTime())))

        startDate = format(minDate, "yyyy-MM-dd")
        endDate = format(maxDate, "yyyy-MM-dd")

        // Calculate total duration across all ranges
        duration = dateRanges.reduce((total, range) => {
          return total + calculateDuration(range.startDate, range.endDate)
        }, 0)
      } else {
        // Single date range
        startDate = format(resourceDateRange!.from!, "yyyy-MM-dd")
        endDate = format(resourceDateRange!.to!, "yyyy-MM-dd")
        duration = calculateDuration(startDate, endDate)
        dateRanges = undefined
      }

      // Calculate cost
      const costCalc = calculateResourceCost(selectedResourceType, selectedResourceId, quantity, startDate, endDate)

      dailyCost = costCalc.dailyCost
      totalCost = useMultipleResourceDates ? duration * dailyCost * quantity : costCalc.totalCost

      // Add resource assignment
      const newAssignment = await addTaskResourceAssignment(projectId, selectedTaskId, {
        resourceId: selectedResourceId,
        resourceType: selectedResourceType,
        quantity,
        startDate,
        endDate,
        duration,
        dailyCost,
        totalCost,
        ...(dateRanges?{dateRanges}:{}),
        multipleRanges: useMultipleResourceDates,
      })

      // Update local state
      const updatedTasks = tasks.map((task) => {
        if (task.id === selectedTaskId) {
          return {
            ...task,
            resources: [...task.resources, newAssignment],
          }
        }
        return task
      })

      setTasks(updatedTasks)

      // Reset form
      setSelectedResourceId("")
      setResourceQuantity("1")
      setResourceDateRange(undefined)
      setResourceMultiDateRange({ ranges: [{ from: undefined, to: undefined }] })
      setUseMultipleResourceDates(false)
    } catch (error: any) {
      setError(error.message || "Failed to assign resource")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResourceAssignment = async (taskId: string, assignmentId: string) => {
    try {
      setLoading(true)
      await deleteTaskResourceAssignment(projectId, taskId, assignmentId)

      // Update local state
      const updatedTasks = tasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            resources: task.resources.filter((resource) => resource.id !== assignmentId),
          }
        }
        return task
      })

      setTasks(updatedTasks)
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to delete resource assignment")
    } finally {
      setLoading(false)
    }
  }

  // Fix the handleChangeTaskStatus function to ensure we're not passing undefined values

  // Replace the handleChangeTaskStatus function with this improved version:
  const handleChangeTaskStatus = async (taskId: string, newStatus: ProjectTask["status"], reason?: string) => {
    try {
      setLoading(true)

      // Create an updates object with only defined values
      const updates: Partial<ProjectTask> = { status: newStatus }

      // Only add statusReason if it's defined and not empty
      if (reason !== undefined && reason.trim() !== "") {
        updates.statusReason = reason
      }

      const updatedTask = await updateProjectTask(projectId, taskId, updates)

      // Update local state
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)))
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to update task status")
    } finally {
      setLoading(false)
    }
  }

  const openStatusChangeModal = (taskId: string, type: "block" | "postpone") => {
    setTaskToChangeStatus(taskId)
    setStatusChangeType(type)
    setStatusReason("")
    setStatusModalOpen(true)
  }

  const handleStatusChangeConfirm = () => {
    if (!taskToChangeStatus) return

    const newStatus = statusChangeType === "block" ? "Blocked" : "Postponed"
    handleChangeTaskStatus(taskToChangeStatus, newStatus, statusReason)

    // Close modal and reset state
    setStatusModalOpen(false)
    setTaskToChangeStatus(null)
    setStatusChangeType(null)
    setStatusReason("")
  }

  const getActivityName = (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId)
    return activity ? activity.name : "Unknown Activity"
  }

  const getResourceName = (resourceType: "human" | "material", resourceId: string) => {
    if (resourceType === "human") {
      const resource = humanResources.find((r) => r.id === resourceId)
      return resource ? resource.role : "Unknown Resource"
    } else {
      const resource = materialResources.find((r) => r.id === resourceId)
      return resource ? resource.name : "Unknown Resource"
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

  // When a task is selected for resource assignment, set the date range to match the task
  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId)
      if (task) {
        setResourceDateRange({
          from: new Date(task.startDate),
          to: new Date(task.endDate),
        })
      }
    }
  }, [selectedTaskId, tasks])

  const isDateOutsideTaskRange = (date: Date) => {
    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId)
      if (task) {
        // Create new Date objects to avoid modifying the original dates
        const taskStart = new Date(task.startDate)
        const taskEnd = new Date(task.endDate)

        // Reset hours to ensure proper comparison
        taskStart.setHours(0, 0, 0, 0)
        taskEnd.setHours(0, 0, 0, 0)
        const checkDate = new Date(date)
        checkDate.setHours(0, 0, 0, 0)

        // Check if the date is before the task start date or after the task end date
        return checkDate < taskStart || checkDate > taskEnd
      }
    }
    return false
  }

  // Component for displaying multiple date ranges with a popover
  const DateRangesPopover = ({ dateRanges }: { dateRanges: { startDate: string; endDate: string }[] }) => {
    return (
      <Popover>
        <PopoverTrigger>
          <button
            className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="View date ranges"
            title="Click to view all date ranges"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start" side="bottom">
          <div className="p-4 max-w-sm">
            <h4 className="font-medium mb-3 text-sm">Work Periods</h4>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {dateRanges.map((range, idx) => (
                <div key={idx} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex flex-col">
                    <div className="font-medium text-sm">Period {idx + 1}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(range.startDate)} - {formatDate(range.endDate)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {calculateDuration(range.startDate, range.endDate)} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
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
          <div className="p-4 max-w-sm">
            {humanResourcesCount > 0 && (
              <>
                <h4 className="font-medium mb-3 text-sm">Human Resources</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {task.resources
                    .filter((r) => r.resourceType === "human")
                    .map((resource, idx) => {
                      const humanResource = humanResources.find((hr) => hr.id === resource.resourceId)
                      return (
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                        >
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <div className="font-medium text-sm">{humanResource?.role || "Unknown Role"}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Quantity: {resource.quantity} • Cost: {formatCurrency(resource.dailyCost)}/day
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Total: {formatCurrency(resource.totalCost)}
                            </div>
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
                        <div
                          key={idx}
                          className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                        >
                          <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="flex flex-col">
                            <div className="font-medium text-sm">{materialResource?.name || "Unknown Material"}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              {materialResource?.type || "Unknown Type"}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Quantity: {resource.quantity} • Cost: {formatCurrency(resource.dailyCost)}/day
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Total: {formatCurrency(resource.totalCost)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </>
            )}

            {humanResourcesCount === 0 && materialResourcesCount === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No resources assigned to this task
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-right font-medium">Total cost: {formatCurrency(calculateTaskTotalCost(task))}</div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Get status badge color based on status
  const getStatusBadgeColor = (status: ProjectTask["status"]) => {
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

  // Get priority badge color based on priority
  const getPriorityBadgeColor = (priority: ProjectTask["priority"]) => {
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

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Add New Task</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="taskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task Name
            </label>
            <input
              type="text"
              id="taskName"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="Enter task name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="taskDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="taskDescription"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Describe this task"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="activity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity
            </label>
            <select
              id="activity"
              value={selectedActivityId}
              onChange={(e) => setSelectedActivityId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select an activity</option>
              {activities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <RadioGroup
              value={taskPriority}
              onValueChange={(value) => setTaskPriority(value as "Low" | "Medium" | "High")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Low" id="priority-low" />
                <Label htmlFor="priority-low" className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Low
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Medium" id="priority-medium" />
                <Label htmlFor="priority-medium" className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                  Medium
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="High" id="priority-high" />
                <Label htmlFor="priority-high" className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                  High
                </Label>
              </div>
            </RadioGroup>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="taskDateRange" className="block">
                Task Date Range
              </Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Multiple Ranges</span>
                <Switch
                  checked={useMultipleTaskDates}
                  onCheckedChange={setUseMultipleTaskDates}
                  id="multiple-task-dates"
                />
              </div>
            </div>

            {useMultipleTaskDates ? (
              <DateRangePicker
                multiDateRange={taskMultiDateRange}
                setMultiDateRange={setTaskMultiDateRange}
                placeholder={["Start date", "End date"]}
                className="w-full"
                useMultiple={true}
              />
            ) : (
              <DateRangePicker
                dateRange={taskDateRange}
                setDateRange={setTaskDateRange}
                placeholder={["Start date", "End date"]}
                className="w-full"
              />
            )}
          </div>
          <Button
            onClick={handleAddTask}
            disabled={
              loading ||
              !taskName.trim() ||
              !selectedActivityId ||
              (!useMultipleTaskDates && (!taskDateRange?.from || !taskDateRange?.to)) ||
              (useMultipleTaskDates &&
                (!taskMultiDateRange ||
                  !taskMultiDateRange.ranges.length ||
                  !taskMultiDateRange.ranges.some((range) => range.from && range.to)))
            }
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {isEditing ? "Update Task" : "Add Task"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Assign Resources to Tasks</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="selectTask" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Task
            </label>
            <select
              id="selectTask"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Select a task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <Tabs
            defaultValue="human"
            value={selectedResourceType}
            onValueChange={(value) => setSelectedResourceType(value as "human" | "material")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="human">Human Resources</TabsTrigger>
              <TabsTrigger value="material">Material Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="human" className="pt-4">
              <div>
                <label
                  htmlFor="humanResource"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Select Human Resource
                </label>
                <select
                  id="humanResource"
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a resource</option>
                  {humanResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.role} (${resource.costPerDay}/day)
                    </option>
                  ))}
                </select>
              </div>
            </TabsContent>
            <TabsContent value="material" className="pt-4">
              <div>
                <label
                  htmlFor="materialResource"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Select Material Resource
                </label>
                <select
                  id="materialResource"
                  value={selectedResourceId}
                  onChange={(e) => setSelectedResourceId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a resource</option>
                  {materialResources.map((resource) => (
                    <option key={resource.id} value={resource.id}>
                      {resource.name} (${resource.costAmount}/
                      {resource.costType === "one-time" ? "total" : `per ${resource.amortizationPeriod} days`})
                    </option>
                  ))}
                </select>
              </div>
            </TabsContent>
          </Tabs>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              value={resourceQuantity}
              onChange={(e) => setResourceQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
              <div className="flex items-center space-x-2">
                <span className="text-sm">Multiple Ranges</span>
                <Switch
                  checked={useMultipleResourceDates}
                  onCheckedChange={setUseMultipleResourceDates}
                  id="multiple-resource-dates"
                />
              </div>
            </div>

            {useMultipleResourceDates ? (
              <DateRangePicker
                multiDateRange={resourceMultiDateRange}
                setMultiDateRange={setResourceMultiDateRange}
                placeholder={["Start date", "End date"]}
                useMultiple={true}
              />
            ) : (
              <DateRangePicker
                dateRange={resourceDateRange}
                setDateRange={setResourceDateRange}
                placeholder={["Start date", "End date"]}
              />
            )}
          </div>

          {selectedTaskId &&
            selectedResourceId &&
            ((useMultipleResourceDates && resourceMultiDateRange.ranges.some((r) => r.from && r.to)) ||
              (!useMultipleResourceDates && resourceDateRange?.from && resourceDateRange?.to)) && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <h4 className="text-sm font-medium mb-2">Estimated Cost:</h4>
                {useMultipleResourceDates ? (
                  <>
                    <div className="text-lg font-bold">
                      {formatCurrency(
                        resourceMultiDateRange.ranges
                          .filter((range) => range.from && range.to)
                          .reduce((total, range) => {
                            const startDate = format(range.from!, "yyyy-MM-dd")
                            const endDate = format(range.to!, "yyyy-MM-dd")
                            const duration = calculateDuration(startDate, endDate)
                            const dailyCost = calculateResourceCost(
                              selectedResourceType,
                              selectedResourceId,
                              Number.parseInt(resourceQuantity, 10) || 1,
                              startDate,
                              endDate,
                            ).dailyCost
                            return total + dailyCost * (Number.parseInt(resourceQuantity, 10) || 1) * duration
                          }, 0),
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      For {resourceMultiDateRange.ranges.filter((r) => r.from && r.to).length} work periods, total{" "}
                      {resourceMultiDateRange.ranges
                        .filter((range) => range.from && range.to)
                        .reduce((total, range) => {
                          return (
                            total +
                            calculateDuration(format(range.from!, "yyyy-MM-dd"), format(range.to!, "yyyy-MM-dd"))
                          )
                        }, 0)}{" "}
                      working days
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-bold">
                      {formatCurrency(
                        calculateResourceCost(
                          selectedResourceType,
                          selectedResourceId,
                          Number.parseInt(resourceQuantity, 10) || 1,
                          resourceDateRange?.from ? format(resourceDateRange.from, "yyyy-MM-dd") : "",
                          resourceDateRange?.to ? format(resourceDateRange.to, "yyyy-MM-dd") : "",
                        ).totalCost,
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatCurrency(
                        calculateResourceCost(
                          selectedResourceType,
                          selectedResourceId,
                          Number.parseInt(resourceQuantity, 10) || 1,
                          resourceDateRange?.from ? format(resourceDateRange.from, "yyyy-MM-dd") : "",
                          resourceDateRange?.to ? format(resourceDateRange.to, "yyyy-MM-dd") : "",
                        ).dailyCost,
                      )}{" "}
                      per day × {Number.parseInt(resourceQuantity, 10) || 1} ×{" "}
                      {calculateDuration(
                        resourceDateRange?.from ? format(resourceDateRange.from, "yyyy-MM-dd") : "",
                        resourceDateRange?.to ? format(resourceDateRange.to, "yyyy-MM-dd") : "",
                      )}{" "}
                      days
                    </div>
                  </>
                )}
              </div>
            )}

          <Button
            onClick={handleAssignResource}
            disabled={
              loading ||
              !selectedTaskId ||
              !selectedResourceId ||
              (!useMultipleResourceDates && (!resourceDateRange?.from || !resourceDateRange?.to)) ||
              (useMultipleResourceDates &&
                (!resourceMultiDateRange ||
                  !resourceMultiDateRange.ranges.length ||
                  !resourceMultiDateRange.ranges.some((range) => range.from && range.to)))
            }
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Resource"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {selectedTaskId && tasks.find((t) => t.id === selectedTaskId)?.resources.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium">Resources for {tasks.find((t) => t.id === selectedTaskId)?.name}</h3>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            <div className="p-6">
              <h4 className="text-md font-medium mb-3">Human Resources</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Daily Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.find((t) => t.id === selectedTaskId)?.resources.filter((r) => r.resourceType === "human")
                      .length > 0 ? (
                      tasks
                        .find((t) => t.id === selectedTaskId)
                        ?.resources.filter((r) => r.resourceType === "human")
                        .map((resource, index) => (
                          <tr
                            key={resource.id}
                            className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getResourceName("human", resource.resourceId)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{resource.quantity}</td>
                            <td className="px-4 py-4">
                              {resource.multipleRanges && resource.dateRanges && resource.dateRanges.length > 0 ? (
                                <DateRangesPopover dateRanges={resource.dateRanges} />
                              ) : (
                                formatDate(resource.startDate)
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {resource.multipleRanges && resource.dateRanges && resource.dateRanges.length > 0 ? (
                                <span className="text-xs italic text-gray-500">See periods</span>
                              ) : (
                                formatDate(resource.endDate)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{resource.duration} days</td>
                            <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(resource.dailyCost)}</td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {formatCurrency(resource.totalCost)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteResourceAssignment(selectedTaskId, resource.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                          No human resources assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6">
              <h4 className="text-md font-medium mb-3">Material Resources</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        End Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Daily Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Cost
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tasks.find((t) => t.id === selectedTaskId)?.resources.filter((r) => r.resourceType === "material")
                      .length > 0 ? (
                      tasks
                        .find((t) => t.id === selectedTaskId)
                        ?.resources.filter((r) => r.resourceType === "material")
                        .map((resource, index) => (
                          <tr
                            key={resource.id}
                            className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              {getResourceName("material", resource.resourceId)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{resource.quantity}</td>
                            <td className="px-4 py-4">
                              {resource.multipleRanges && resource.dateRanges && resource.dateRanges.length > 0 ? (
                                <DateRangesPopover dateRanges={resource.dateRanges} />
                              ) : (
                                formatDate(resource.startDate)
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {resource.multipleRanges && resource.dateRanges && resource.dateRanges.length > 0 ? (
                                <span className="text-xs italic text-gray-500">See periods</span>
                              ) : (
                                formatDate(resource.endDate)
                              )}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">{resource.duration} days</td>
                            <td className="px-4 py-4 whitespace-nowrap">{formatCurrency(resource.dailyCost)}</td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium">
                              {formatCurrency(resource.totalCost)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => handleDeleteResourceAssignment(selectedTaskId, resource.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                          No material resources assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <div className="text-right font-medium">
                Total task cost: {formatCurrency(calculateTaskTotalCost(tasks.find((t) => t.id === selectedTaskId)!))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Tasks</h3>
        {loading && !tasks.length ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : tasks.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Task Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resources
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tasks.map((task, index) => (
                  <tr
                    key={task.id}
                    className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium">{task.name}</div>
                      {task.description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</div>
                      )}
                      {task.statusReason && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                          Reason: {task.statusReason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{getActivityName(task.activityId)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={getStatusBadgeColor(task.status || "Not Started")}>
                        {task.status || "Not Started"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge className={getPriorityBadgeColor(task.priority || "Medium")}>
                        {task.priority || "Medium"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      {task.multipleRanges && task.dateRanges && task.dateRanges.length > 0 ? (
                        <DateRangesPopover dateRanges={task.dateRanges} />
                      ) : (
                        formatDate(task.startDate)
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {task.multipleRanges && task.dateRanges && task.dateRanges.length > 0 ? (
                        <span className="text-xs italic text-gray-500">See periods</span>
                      ) : (
                        formatDate(task.endDate)
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {task.multipleRanges && task.dateRanges ? (
                        <span>{task.duration} days</span>
                      ) : (
                        <span>{task.duration} days</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <ResourcesPopover task={task} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                      {formatCurrency(calculateTaskTotalCost(task))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Status action buttons */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {task.status === "Not Started" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleChangeTaskStatus(task.id, "In Progress")}
                              >
                                <Play className="h-3 w-3 mr-1" /> Start
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => openStatusChangeModal(task.id, "block")}
                              >
                                <Ban className="h-3 w-3 mr-1" /> Block
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                                onClick={() => openStatusChangeModal(task.id, "postpone")}
                              >
                                <Clock className="h-3 w-3 mr-1" /> Postpone
                              </Button>
                            </>
                          )}

                          {task.status === "In Progress" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                                onClick={() => handleChangeTaskStatus(task.id, "Completed")}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" /> Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => openStatusChangeModal(task.id, "block")}
                              >
                                <Ban className="h-3 w-3 mr-1" /> Block
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs text-yellow-600 border-yellow-200 hover:bg-yellow-50 hover:text-yellow-700"
                                onClick={() => openStatusChangeModal(task.id, "postpone")}
                              >
                                <Clock className="h-3 w-3 mr-1" /> Postpone
                              </Button>
                            </>
                          )}

                          {(task.status === "Blocked" || task.status === "Postponed") && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleChangeTaskStatus(task.id, "In Progress")}
                            >
                              <Play className="h-3 w-3 mr-1" /> Start
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No tasks found. Add your first task to get started.</p>
          </div>
        )}
      </div>

      {/* Status change reason modal */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{statusChangeType === "block" ? "Block Task" : "Postpone Task"}</DialogTitle>
            <DialogDescription>
              Please provide a reason for {statusChangeType === "block" ? "blocking" : "postponing"} this task.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="statusReason" className="mb-2 block">
              Reason
            </Label>
            <Textarea
              id="statusReason"
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              placeholder={`Why are you ${statusChangeType === "block" ? "blocking" : "postponing"} this task?`}
              className="min-h-[100px]"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChangeConfirm}
              disabled={!statusReason.trim()}
              className={
                statusChangeType === "block" ? "bg-red-600 hover:bg-red-700" : "bg-yellow-600 hover:bg-yellow-700"
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
