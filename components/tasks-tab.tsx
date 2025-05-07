"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Trash2, Plus, Loader2, ArrowRight } from "lucide-react"
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
import { DateRangePicker } from "@/components/ui/ant-date-picker"
import { Label } from "@/components/ui/label"

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
  const [taskDateRange, setTaskDateRange] = useState<{ from?: Date; to?: Date } | undefined>()
  const [isEditing, setIsEditing] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  // Remove the dueDate state since we'll use taskDateRange instead

  // Resource assignment form state
  const [selectedTaskId, setSelectedTaskId] = useState("")
  const [selectedResourceType, setSelectedResourceType] = useState<"human" | "material">("human")
  const [selectedResourceId, setSelectedResourceId] = useState("")
  const [resourceQuantity, setResourceQuantity] = useState("1")
  const [resourceDateRange, setResourceDateRange] = useState<{ from?: Date; to?: Date } | undefined>()

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

    if (!taskDateRange?.from || !taskDateRange?.to) {
      setError("Start and end dates are required")
      return
    }

    try {
      setLoading(true)
      setError("")

      const startDate = format(taskDateRange.from, "yyyy-MM-dd")
      const endDate = format(taskDateRange.to, "yyyy-MM-dd")
      const duration = calculateDuration(startDate, endDate)

      if (isEditing && currentTaskId) {
        // Update existing task
        const updatedTask = await updateProjectTask(projectId, currentTaskId, {
          name: taskName,
          description: taskDescription,
          activityId: selectedActivityId,
          startDate,
          endDate,
          duration,
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
        })

        // Update local state
        setTasks([...tasks, newTask])
      }

      // Reset form
      setTaskName("")
      setTaskDescription("")
      setSelectedActivityId("")
      setTaskDateRange(undefined)
      setIsEditing(false)
      setCurrentTaskId(null)
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
    setTaskDateRange({
      from: new Date(task.startDate),
      to: new Date(task.endDate),
    })
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

    if (!resourceDateRange?.from || !resourceDateRange?.to) {
      setError("Start and end dates are required")
      return
    }

    // Validate that resource dates are within task dates
    const selectedTask = tasks.find((t) => t.id === selectedTaskId)
    if (selectedTask) {
      const taskStart = new Date(selectedTask.startDate)
      const taskEnd = new Date(selectedTask.endDate)

      // Reset hours to ensure proper comparison
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)
      const resourceStart = new Date(resourceDateRange.from)
      const resourceEnd = new Date(resourceDateRange.to)
      resourceStart.setHours(0, 0, 0, 0)
      resourceEnd.setHours(0, 0, 0, 0)

      if (resourceStart < taskStart || resourceEnd > taskEnd) {
        setError("Resource dates must be within the task's date range")
        return
      }
    }

    try {
      setLoading(true)
      setError("")

      const resourceStartDate = resourceDateRange?.from ? format(resourceDateRange.from, "yyyy-MM-dd") : ""
      const resourceEndDate = resourceDateRange?.to ? format(resourceDateRange.to, "yyyy-MM-dd") : ""
      const quantity = Number.parseInt(resourceQuantity, 10) || 1
      const duration = calculateDuration(resourceStartDate, resourceEndDate)
      const { dailyCost, totalCost } = calculateResourceCost(
        selectedResourceType,
        selectedResourceId,
        quantity,
        resourceStartDate,
        resourceEndDate,
      )

      // Add resource assignment
      const newAssignment = await addTaskResourceAssignment(projectId, selectedTaskId, {
        resourceId: selectedResourceId,
        resourceType: selectedResourceType,
        quantity,
        startDate: resourceStartDate,
        endDate: resourceEndDate,
        duration,
        dailyCost,
        totalCost,
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

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
          <div className="mb-4">
            <Label htmlFor="taskDateRange" className="mb-2 block">
              Task Date Range
            </Label>
            <DateRangePicker
              dateRange={taskDateRange}
              setDateRange={setTaskDateRange}
              placeholder={["Start date", "End date"]}
              className="w-full"
            />
          </div>
          <Button
            onClick={handleAddTask}
            disabled={loading || !taskName.trim() || !selectedActivityId || !taskDateRange?.from || !taskDateRange?.to}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
            <DateRangePicker
              dateRange={resourceDateRange}
              setDateRange={setResourceDateRange}
              placeholder={["Start date", "End date"]}
            />
          </div>

          {selectedTaskId && selectedResourceId && resourceDateRange?.from && resourceDateRange?.to && (
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">Estimated Cost:</h4>
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
            </div>
          )}

          <Button
            onClick={handleAssignResource}
            disabled={
              loading || !selectedTaskId || !selectedResourceId || !resourceDateRange?.from || !resourceDateRange?.to
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
                            <td className="px-4 py-4 whitespace-nowrap">{formatDate(resource.startDate)}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{formatDate(resource.endDate)}</td>
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
                            <td className="px-4 py-4 whitespace-nowrap">{formatDate(resource.startDate)}</td>
                            <td className="px-4 py-4 whitespace-nowrap">{formatDate(resource.endDate)}</td>
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
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{getActivityName(task.activityId)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(task.startDate)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(task.endDate)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{task.duration} days</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium">
                          {task.resources.filter((r) => r.resourceType === "human").length} human
                        </span>
                        <ArrowRight className="h-3 w-3 mx-1 text-gray-400" />
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded text-xs font-medium">
                          {task.resources.filter((r) => r.resourceType === "material").length} material
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">
                      {formatCurrency(calculateTaskTotalCost(task))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
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
    </div>
  )
}
