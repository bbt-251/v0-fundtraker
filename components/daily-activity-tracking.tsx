"use client"

import { useState, useEffect, useCallback } from "react"
import { Filter, CheckCircle, Clock, AlertTriangle, XCircle, PauseCircle, Edit, Loader2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/ant-date-picker"
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/firebase"
import { isWithinInterval, parseISO } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import type { ProjectTask } from "@/types/project"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { message } from "antd"
import { getTeamMembers } from "@/services/team-member-service"

// Define task status types
type TaskStatus = "Not Started" | "In Progress" | "Completed" | "Blocked" | "Postponed"

// Define priority types
type TaskPriority = "Low" | "Medium" | "High"

// Extended task interface with project information
interface ExtendedTask extends ProjectTask {
    projectId: string
    projectName: string
}

// Status options
const statusOptions: { value: TaskStatus; label: string }[] = [
    { value: "In Progress", label: "In Progress" },
    { value: "Postponed", label: "Postponed" },
    { value: "Blocked", label: "Blocked" },
    { value: "Completed", label: "Completed" },
    { value: "Not Started", label: "Not Started" },
]

// Priority options
const priorityOptions: { value: TaskPriority; label: string }[] = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
]

interface DailyActivityTrackingProps {
    initialDate?: Date
    onDateChange?: (date: Date) => void
    projectId?: string
}

export function DailyActivityTracking({ initialDate, onDateChange, projectId }: DailyActivityTrackingProps) {
    const { toast } = useToast()
    const [date, setDate] = useState<Date>(initialDate || new Date())
    const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null)
    const [priorityFilter, setPriorityFilter] = useState<TaskPriority | null>(null)
    const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null)
    const [tasks, setTasks] = useState<ExtendedTask[]>([])
    const [assignees, setAssignees] = useState<
        { value: string; label: string; id?: string; type?: "teamMember" | "existing" }[]
    >([])
    const [loading, setLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false) // Add loading state for save button

    // Add state for the edit modal
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [currentTask, setCurrentTask] = useState<ExtendedTask | null>(null)
    const [editStatus, setEditStatus] = useState<TaskStatus>("Not Started") // Default value
    const [editPriority, setEditPriority] = useState<TaskPriority>("Medium") // Default value
    const [editAssignee, setEditAssignee] = useState<string>("")

    // Create message API
    const [messageApi, contextHolder] = message.useMessage()

    // Update local date state when initialDate prop changes
    useEffect(() => {
        if (initialDate && initialDate.getTime() !== date.getTime()) {
            setDate(initialDate)
        }
    }, [initialDate, date])

    // Fetch tasks from projects owned by the logged-in user
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true)

                // Get current user ID
                const userId = auth.currentUser?.uid
                if (!userId) {
                    console.error("No user logged in")
                    setLoading(false)
                    return
                }

                // Get projects owned by the user
                const projectsRef = collection(db, "projects")
                const q = query(projectsRef, where("userId", "==", userId))
                const querySnapshot = await getDocs(q)

                const fetchedTasks: ExtendedTask[] = []
                const uniqueAssignees = new Set<string>()

                // Process each project
                for (const projectDoc of querySnapshot.docs) {
                    // Skip if projectId is provided and doesn't match
                    if (projectId && projectDoc.id !== projectId) continue

                    const projectData = projectDoc.data()
                    const projectTasks = projectData.tasks || []
                    const projectName = projectData.name || "Unnamed Project"

                    // Process each task in the project
                    projectTasks.forEach((task: ProjectTask) => {
                        // Check if the task date matches the selected date
                        const isTaskForSelectedDate = isTaskOnDate(task, date)

                        if (isTaskForSelectedDate) {
                            // Add task with project information
                            fetchedTasks.push({
                                ...task,
                                projectId: projectDoc.id,
                                projectName,
                            })

                            // Collect unique assignees
                            if (task.assignee) {
                                uniqueAssignees.add(task.assignee)
                            }
                        }
                    })
                }

                // After the loop, update the assignees state:
                setAssignees((prev) => {
                    const existingOptions = Array.from(uniqueAssignees).map((name) => ({
                        value: name,
                        label: name,
                        type: "existing" as const,
                    }))

                    // Keep team members and add new existing assignees
                    const teamMembers = prev.filter((a) => a.type === "teamMember")

                    return [...teamMembers, ...existingOptions]
                })

                // Update state with fetched tasks and assignees
                setTasks(fetchedTasks)
            } catch (error) {
                console.error("Error fetching tasks:", error)
                toast({
                    title: "Error",
                    description: "Failed to load tasks. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchTasks()
    }, [date, toast, projectId])

    // Fetch team members for the current user (project owner)
    useEffect(() => {
        const fetchTeamMembers = async () => {
            try {
                // Get current user ID (project owner)
                const userId = auth.currentUser?.uid
                if (!userId) {
                    console.error("No user logged in")
                    return
                }

                // Fetch team members by owner ID, not by project ID
                const members = await getTeamMembers(userId)

                // Create assignee options from team members
                const teamMemberOptions = members.map((member) => ({
                    value: member.id,
                    label: `${member.firstName} ${member.lastName} (${member.role})`,
                    id: member.id,
                    type: "teamMember" as const,
                }))

                // Merge with existing assignees, avoiding duplicates
                setAssignees((prevAssignees) => {
                    const existingAssignees = prevAssignees.filter((a) => a.type === "existing")

                    // Create a combined array without duplicates
                    const combined = [...existingAssignees]

                    // Add team members that aren't already in the list
                    teamMemberOptions.forEach((option) => {
                        if (!combined.some((a) => a.id === option.id)) {
                            combined.push(option)
                        }
                    })

                    return combined
                })
            } catch (error) {
                console.error("Error fetching team members:", error)
            }
        }

        fetchTeamMembers()
    }, []) // Only fetch once when component mounts

    // Function to open the edit modal - use useCallback to memoize
    const openEditModal = useCallback((task: ExtendedTask) => {
        setCurrentTask(task)
        // Set default values or use existing values, never undefined
        setEditStatus((task.status as TaskStatus) || "Not Started")
        setEditPriority((task.priority as TaskPriority) || "Medium")
        setEditAssignee(task.assignee || "")
        setEditModalOpen(true)
    }, [])

    // Function to save the edited task - use useCallback to memoize
    const saveTaskEdits = useCallback(async () => {
        if (!currentTask) {
            console.error("No task selected for editing")
            messageApi.error("Error: No task selected for editing")
            return
        }

        // Set loading state
        setIsSaving(true)

        // Show loading message
        const loadingMessage = messageApi.loading("Saving task changes...", 0)

        try {
            // Get the project document
            const projectRef = doc(db, "projects", currentTask.projectId)
            const projectSnap = await getDoc(projectRef)

            if (!projectSnap.exists()) {
                throw new Error("Project not found")
            }

            const projectData = projectSnap.data()
            const projectTasks = projectData.tasks || []

            // Find the selected assignee option
            const selectedAssignee = assignees.find((a) => a.value === editAssignee)

            // Determine the assignee name and ID based on the type
            let assigneeName = ""
            let assigneeId = ""

            if (selectedAssignee) {
                if (selectedAssignee.type === "teamMember") {
                    assigneeName = selectedAssignee.label
                    assigneeId = selectedAssignee.id || ""
                } else {
                    assigneeName = selectedAssignee.label
                    assigneeId = selectedAssignee.value
                }
            }

            // Update the task with the correct assignee information
            const updatedTasks = projectTasks.map((task: ProjectTask) => {
                if (task.id === currentTask.id) {
                    // Create a clean update object with only the fields we want to update
                    const updatedTask = { ...task }

                    // Only set fields that have valid values
                    updatedTask.status = editStatus
                    updatedTask.priority = editPriority

                    // Only update assignee if it's not empty
                    if (editAssignee && editAssignee !== "unassigned") {
                        updatedTask.assignee = assigneeId
                        updatedTask.assignedToName = assigneeName
                    } else {
                        // If "Unassigned" is selected, clear the assignee
                        updatedTask.assignee = undefined
                        updatedTask.assignedToName = undefined
                    }

                    return updatedTask
                }
                return task
            })

            // Update the project document
            await updateDoc(projectRef, {
                tasks: updatedTasks,
                updatedAt: new Date().toISOString(),
            })

            // Update local state
            setTasks(
                tasks.map((task) => {
                    if (task.id === currentTask.id) {
                        const updatedTask = {
                            ...task,
                            status: editStatus,
                            priority: editPriority,
                        }

                        if (editAssignee && editAssignee !== "unassigned") {
                            const selectedAssignee = assignees.find((a) => a.value === editAssignee)
                            if (selectedAssignee) {
                                updatedTask.assignee =
                                    selectedAssignee.type === "teamMember" ? selectedAssignee.id : selectedAssignee.value
                                updatedTask.assignedToName = selectedAssignee.label
                            }
                        } else {
                            updatedTask.assignee = undefined
                            updatedTask.assignedToName = undefined
                        }

                        return updatedTask
                    }
                    return task
                }),
            )

            // Close loading message
            loadingMessage()

            // Show success message
            messageApi.success("Task updated successfully")

            // Close the modal
            setEditModalOpen(false)
        } catch (error) {
            console.error("Error updating task:", error)

            // Close loading message
            loadingMessage()

            // Show error message
            messageApi.error("Failed to update task. Please try again.")
        } finally {
            // Reset loading state
            setIsSaving(false)
        }
    }, [currentTask, editStatus, editPriority, editAssignee, messageApi, tasks, assignees])

    // Check if a task is scheduled for the selected date
    const isTaskOnDate = (task: ProjectTask, selectedDate: Date): boolean => {
        try {
            // If task has multiple date ranges
            if (task.multipleRanges && task.dateRanges && task.dateRanges.length > 0) {
                // Check if the selected date falls within any of the date ranges
                return task.dateRanges.some((range) => {
                    const startDate = parseISO(range.startDate)
                    const endDate = parseISO(range.endDate)
                    return isWithinInterval(selectedDate, { start: startDate, end: endDate })
                })
            }
            // If task has a single date range
            else if (task.startDate && task.endDate) {
                const startDate = parseISO(task.startDate)
                const endDate = parseISO(task.endDate)
                return isWithinInterval(selectedDate, { start: startDate, end: endDate })
            }

            return false
        } catch (error) {
            console.error("Error checking task date:", error)
            return false
        }
    }

    // Get all tasks for the selected date (regardless of other filters)
    const tasksForSelectedDate = tasks

    // Apply assignee, priority, and status filters
    const filteredTasks = tasks.filter((task) => {
        if (assigneeFilter && task.assignee !== assigneeFilter) return false
        if (priorityFilter && task.priority !== priorityFilter) return false
        if (statusFilter && task.status !== statusFilter) return false
        return true
    })

    // Count tasks by status - always based on the selected date, not affected by other filters
    const taskCounts = {
        total: tasksForSelectedDate.length,
        completed: tasksForSelectedDate.filter((task) => task.status === "Completed").length,
        inProgress: tasksForSelectedDate.filter((task) => task.status === "In Progress").length,
        blocked: tasksForSelectedDate.filter((task) => task.status === "Blocked").length,
        postponed: tasksForSelectedDate.filter((task) => task.status === "Postponed").length,
        notStarted: tasksForSelectedDate.filter((task) => task.status === "Not Started").length,
    }

    // Update task status in the project document - use useCallback to memoize
    const updateTaskStatus = useCallback(
        async (taskId: string, projectId: string, newStatus: TaskStatus) => {
            try {
                // Get the project document
                const projectRef = doc(db, "projects", projectId)
                const projectSnap = await getDoc(projectRef)

                if (!projectSnap.exists()) {
                    throw new Error("Project not found")
                }

                const projectData = projectSnap.data()
                const projectTasks = projectData.tasks || []

                // Find and update the task
                const updatedTasks = projectTasks.map((task: ProjectTask) =>
                    task.id === taskId ? { ...task, status: newStatus } : task,
                )

                // Update the project document
                await updateDoc(projectRef, {
                    tasks: updatedTasks,
                    updatedAt: new Date().toISOString(),
                })

                // Update local state
                setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))

                toast({
                    title: "Status updated",
                    description: `Task status changed to ${newStatus}`,
                })
            } catch (error) {
                console.error("Error updating task status:", error)
                toast({
                    title: "Error",
                    description: "Failed to update task status. Please try again.",
                    variant: "destructive",
                })
            }
        },
        [tasks, toast],
    )

    // Get status badge color
    const getStatusColor = useCallback((status: TaskStatus) => {
        switch (status) {
            case "Completed":
                return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
            case "In Progress":
                return "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
            case "Blocked":
                return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
            case "Postponed":
                return "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
            case "Not Started":
                return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            default:
                return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
        }
    }, [])

    // Get status icon
    const getStatusIcon = useCallback((status: TaskStatus) => {
        switch (status) {
            case "Completed":
                return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            case "In Progress":
                return <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            case "Blocked":
                return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            case "Postponed":
                return <PauseCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            case "Not Started":
                return <XCircle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            default:
                return null
        }
    }, [])

    // Handle date change - use useCallback to memoize
    const handleDateChange = useCallback(
        (newDate: Date | null) => {
            if (newDate) {
                // Set local state
                setDate(newDate)

                // Call the parent component's onDateChange if provided
                if (onDateChange) {
                    onDateChange(newDate)
                }
            }
        },
        [onDateChange],
    )

    // Handle filter changes - use useCallback to memoize
    const handleAssigneeFilterChange = useCallback((value: string) => {
        setAssigneeFilter(value === "all" ? null : value)
    }, [])

    const handlePriorityFilterChange = useCallback((value: string) => {
        setPriorityFilter(value === "all" ? null : (value as TaskPriority))
    }, [])

    const handleStatusFilterChange = useCallback((value: TaskStatus | null) => {
        setStatusFilter(value)
    }, [])

    const clearFilters = useCallback(() => {
        setAssigneeFilter(null)
        setPriorityFilter(null)
        setStatusFilter(null)
    }, [])

    return (
        <div className="space-y-6">
            {/* Antd Message Context Holder */}
            {contextHolder}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold">Task Tracking</h2>

                {/* Date Picker */}
                <DatePicker
                    date={date}
                    onDateChange={handleDateChange}
                    className="w-[240px]"
                    placeholder="Select date"
                    format="MMMM DD, YYYY"
                />
            </div>

            <p className="text-muted-foreground">Track progress of project tasks</p>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {/* Assignee Filter */}
                <Select value={assigneeFilter || "all"} onValueChange={handleAssigneeFilterChange} defaultValue="all">
                    <SelectTrigger className="w-[200px] gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Assignees</SelectItem>
                        {assignees.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Priority Filter */}
                <Select value={priorityFilter || "all"} onValueChange={handlePriorityFilterChange} defaultValue="all">
                    <SelectTrigger className="w-[200px] gap-2">
                        <Filter className="h-4 w-4" />
                        <SelectValue placeholder="Filter by Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        {priorityOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {(assigneeFilter || priorityFilter || statusFilter) && (
                    <Button variant="outline" onClick={clearFilters} className="text-sm">
                        Clear Filters
                    </Button>
                )}
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Tasks Card */}
                <Card
                    className={`p-4 cursor-pointer ${statusFilter === null ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleStatusFilterChange(null)}
                >
                    <div className="text-sm font-medium text-muted-foreground">Total Tasks</div>
                    <div className="text-3xl font-bold mt-1">{taskCounts.total}</div>
                </Card>

                {/* Completed Tasks Card */}
                <Card
                    className={`p-4 cursor-pointer ${statusFilter === "Completed" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleStatusFilterChange(statusFilter === "Completed" ? null : "Completed")}
                >
                    <div className="text-sm font-medium text-green-600 dark:text-green-400">Completed</div>
                    <div className="text-3xl font-bold mt-1 text-green-600 dark:text-green-400">{taskCounts.completed}</div>
                </Card>

                {/* In Progress Tasks Card */}
                <Card
                    className={`p-4 cursor-pointer ${statusFilter === "In Progress" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleStatusFilterChange(statusFilter === "In Progress" ? null : "In Progress")}
                >
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400">In Progress</div>
                    <div className="text-3xl font-bold mt-1 text-blue-600 dark:text-blue-400">{taskCounts.inProgress}</div>
                </Card>

                {/* Blocked Tasks Card */}
                <Card
                    className={`p-4 cursor-pointer ${statusFilter === "Blocked" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleStatusFilterChange(statusFilter === "Blocked" ? null : "Blocked")}
                >
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">Blocked</div>
                    <div className="text-3xl font-bold mt-1 text-red-600 dark:text-red-400">{taskCounts.blocked}</div>
                </Card>

                {/* Postponed Tasks Card */}
                <Card
                    className={`p-4 cursor-pointer ${statusFilter === "Postponed" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleStatusFilterChange(statusFilter === "Postponed" ? null : "Postponed")}
                >
                    <div className="text-sm font-medium text-amber-600 dark:text-amber-400">Postponed</div>
                    <div className="text-3xl font-bold mt-1 text-amber-600 dark:text-amber-400">{taskCounts.postponed}</div>
                </Card>

                {/* Not Started Tasks Card */}
                <Card
                    className={`p-4 cursor-pointer ${statusFilter === "Not Started" ? "ring-2 ring-primary" : ""}`}
                    onClick={() => handleStatusFilterChange(statusFilter === "Not Started" ? null : "Not Started")}
                >
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Not Started</div>
                    <div className="text-3xl font-bold mt-1 text-gray-600 dark:text-gray-400">{taskCounts.notStarted}</div>
                </Card>
            </div>

            {/* Task List */}
            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-2 text-muted-foreground">Loading tasks...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map((task) => (
                            <div key={task.id} className="border rounded-lg p-4 bg-card relative">
                                <div className="flex flex-col sm:flex-row justify-between mb-2">
                                    <div>
                                        <h3 className="text-lg font-medium">{task.name}</h3>
                                        <p className="text-xs text-muted-foreground">Project: {task.projectName}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">ID: {task.id}</div>
                                </div>

                                {task.description && <p className="text-sm text-muted-foreground mb-3">{task.description}</p>}

                                <div className="flex flex-wrap gap-2 mt-2">
                                    {/* Status Chip */}
                                    <div
                                        className={`rounded-full px-3 py-1 h-8 text-sm font-medium flex items-center ${getStatusColor((task.status as TaskStatus) || "Not Started")}`}
                                    >
                                        {getStatusIcon((task.status as TaskStatus) || "Not Started")}
                                        <span className="ml-1">{task.status || "Not Started"}</span>
                                    </div>

                                    {/* Assignee Chip */}
                                    <div className="rounded-full bg-gray-800 px-3 py-1 text-sm font-medium text-white flex items-center h-8">
                                        Assignee: {task.assignedToName || task.assignee || "Unassigned"}
                                    </div>

                                    {/* Priority Chip */}
                                    <div
                                        className={`rounded-full px-3 py-1 h-8 text-sm font-medium flex items-center ${task.priority === "High"
                                            ? "bg-red-500 text-white"
                                            : task.priority === "Medium"
                                                ? "bg-amber-500 text-white"
                                                : "bg-green-500 text-white"
                                            }`}
                                    >
                                        {task.priority || "Medium"} Priority
                                    </div>
                                </div>

                                {/* Edit Button */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute bottom-2 right-2"
                                    onClick={() => openEditModal(task)}
                                >
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only">Edit task</span>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {tasks.length === 0 ? "No tasks found for the selected date." : "No tasks match the selected filters."}
                        </div>
                    )}
                </div>
            )}

            {/* Edit Task Modal */}
            <Dialog open={editModalOpen} onOpenChange={(open) => !isSaving && setEditModalOpen(open)}>
                <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Edit Task</DialogTitle>
                    </DialogHeader>

                    {currentTask && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="task-status" className="text-gray-300 text-right">
                                    Status
                                </label>
                                <Select
                                    value={editStatus}
                                    onValueChange={(value) => setEditStatus(value as TaskStatus)}
                                    defaultValue={editStatus}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger id="task-status" className="col-span-3 bg-gray-800 border-gray-700 text-white">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        {statusOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="task-assignee" className="text-gray-300 text-right">
                                    Assignee
                                </label>
                                <Select
                                    value={editAssignee || "unassigned"}
                                    onValueChange={setEditAssignee}
                                    defaultValue={editAssignee || "unassigned"}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger id="task-assignee" className="col-span-3 bg-gray-800 border-gray-700 text-white">
                                        <SelectValue placeholder="Select assignee" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        <SelectItem value="unassigned" className="text-white hover:bg-gray-700">
                                            Unassigned
                                        </SelectItem>
                                        {assignees.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="task-priority" className="text-gray-300 text-right">
                                    Priority
                                </label>
                                <Select
                                    value={editPriority}
                                    onValueChange={(value) => setEditPriority(value as TaskPriority)}
                                    defaultValue={editPriority}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger id="task-priority" className="col-span-3 bg-gray-800 border-gray-700 text-white">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                        {priorityOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value} className="text-white hover:bg-gray-700">
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setEditModalOpen(false)}
                            className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button onClick={saveTaskEdits} className="bg-blue-600 text-white hover:bg-blue-700" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
