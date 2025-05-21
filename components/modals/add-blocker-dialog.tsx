"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { createBlocker } from "@/services/blocker-service"
import { useToast } from "@/hooks/use-toast"
import type { BlockerFormData, BlockerImpact } from "@/types/blocker"
import type { TeamMember } from "@/types/team-member"
import { getTeamMembers } from "@/services/team-member-service"
import { useAuth } from "@/contexts/auth-context"
import { DatePicker } from "@/components/ui/ant-date-picker"
import { getTasks } from "@/services/task-service"
import type { Task } from "@/types/task"
import { Select as AntSelect, Spin, message } from "antd"
import "antd/dist/reset.css" // Make sure Ant Design styles are imported

interface AddBlockerDialogProps {
  onAddBlocker: (blocker: any) => void
  projectId?: string
}

export function AddBlockerDialog({ onAddBlocker, projectId }: AddBlockerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  const [formData, setFormData] = useState<BlockerFormData>({
    title: "",
    description: "",
    impact: "Medium",
    impactDescription: "",
    reportedById: "",
    reportedBy: "",
    assignedToId: "",
    assignedTo: "",
    reportedDate: new Date(),
    expectedResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
    resolutionPlan: "",
    relatedTasks: "",
    notes: "",
    projectId: projectId || "",
  })

  useEffect(() => {
    if (open) {
      fetchTeamMembers()
      fetchTasks()
      // Set the current user as the reporter by default
      if (user) {
        setFormData((prev) => ({
          ...prev,
          reportedById: user.uid,
          reportedBy: user.displayName || user.email || "",
          projectId: projectId || prev.projectId,
        }))
      }
    }
  }, [open, user, projectId])

  const fetchTeamMembers = async () => {
    if (!user) return

    try {
      setLoadingTeamMembers(true)
      const members = await getTeamMembers(user.uid)
      setTeamMembers(members)
    } catch (error) {
      console.error("Error fetching team members:", error)
      message.error("Failed to load team members")
    } finally {
      setLoadingTeamMembers(false)
    }
  }

  const fetchTasks = async () => {
    if (!user) return

    try {
      setLoadingTasks(true)
      // If we have a projectId, fetch tasks for that project, otherwise fetch all tasks
      const fetchedTasks = projectId ? await getTasks(projectId) : await getAllTasks()
      setTasks(fetchedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      message.error("Failed to load tasks")
    } finally {
      setLoadingTasks(false)
    }
  }

  // This is a placeholder function - you'll need to implement the actual service
  const getAllTasks = async (): Promise<Task[]> => {
    // For now, return an empty array or mock data
    return [
      { id: "task-001", title: "TASK-001: Setup API Integration", projectId: "project-1" },
      { id: "task-002", title: "TASK-002: Design Database Schema", projectId: "project-1" },
      { id: "task-003", title: "TASK-003: Implement Authentication", projectId: "project-1" },
      { id: "task-004", title: "TASK-004: Create User Dashboard", projectId: "project-2" },
      { id: "task-005", title: "TASK-005: Test Payment Processing", projectId: "project-2" },
    ]
  }

  const handleChange = (field: keyof BlockerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTaskChange = (value: string[]) => {
    setSelectedTasks(value)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // Validation
      if (!formData.title) {
        message.error("Title is required")
        return
      }

      if (!formData.description) {
        message.error("Description is required")
        return
      }

      if (!formData.assignedToId) {
        message.error("Assigned To is required")
        return
      }

      if (!formData.resolutionPlan) {
        message.error("Resolution Plan is required")
        return
      }

      if (selectedTasks.length === 0) {
        message.error("At least one related task is required")
        return
      }

      // Find the assigned team member to get their name
      const assignedMember = teamMembers.find((member) => member.id === formData.assignedToId)
      if (!assignedMember) {
        message.error("Selected team member not found")
        return
      }

      // Find the reporting team member to get their name
      const reportingMember = teamMembers.find((member) => member.id === formData.reportedById)

      // Format the related tasks
      const relatedTasksText = selectedTasks
        .map((taskId) => {
          const task = tasks.find((t) => t.id === taskId)
          return task ? task.title.split(":")[0].trim() : taskId
        })
        .join(", ")

      // Create the blocker with the assigned team member's name
      const newBlocker = await createBlocker({
        ...formData,
        relatedTasks: relatedTasksText,
        assignedTo: `${assignedMember.firstName} ${assignedMember.lastName}`,
        reportedBy: reportingMember
          ? `${reportingMember.firstName} ${reportingMember.lastName}`
          : formData.reportedBy || user?.displayName || user?.email || "Unknown",
      })

      message.success("Blocker added successfully")
      onAddBlocker(newBlocker)
      setOpen(false)
      resetForm()
    } catch (error: any) {
      console.error("Error adding blocker:", error)
      message.error(error.message || "Failed to add blocker")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      impact: "Medium",
      impactDescription: "",
      reportedById: user?.uid || "",
      reportedBy: user?.displayName || user?.email || "",
      assignedToId: "",
      assignedTo: "",
      reportedDate: new Date(),
      expectedResolutionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      resolutionPlan: "",
      relatedTasks: "",
      notes: "",
      projectId: projectId || "",
    })
    setSelectedTasks([])
  }

  // Create options for the AntSelect component
  const taskOptions = tasks.map((task) => ({
    value: task.id,
    label: task.title,
  }))

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Blocker
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <DialogTitle className="text-xl">Add New Blocker</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Add details about a new blocker or delay affecting project progress.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Blocker Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., API Integration Delay"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reportedBy">Reported By</Label>
              <Select value={formData.reportedById} onValueChange={(value) => handleChange("reportedById", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {loadingTeamMembers ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No team members found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={formData.assignedToId} onValueChange={(value) => handleChange("assignedToId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {loadingTeamMembers ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No team members found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="relatedTasks">Related Tasks</Label>
            <div className="relative">
              {/* Replace AntSelect with a direct import from antd */}
              <div className="ant-select-wrapper" style={{ minHeight: "40px" }}>
                {typeof window !== "undefined" && (
                  <AntSelect
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Select tasks..."
                    value={selectedTasks}
                    onChange={handleTaskChange}
                    options={taskOptions}
                    optionFilterProp="label"
                    notFoundContent={loadingTasks ? <Spin size="small" /> : "No tasks found"}
                    maxTagCount={3}
                    maxTagTextLength={10}
                    dropdownStyle={{ zIndex: 9999 }}
                    getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="impact">Impact Level</Label>
              <Select value={formData.impact} onValueChange={(value) => handleChange("impact", value as BlockerImpact)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select impact level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low Impact</SelectItem>
                  <SelectItem value="Medium">Medium Impact</SelectItem>
                  <SelectItem value="High">High Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="impactDescription">Impact Description</Label>
              <Input
                id="impactDescription"
                value={formData.impactDescription}
                onChange={(e) => handleChange("impactDescription", e.target.value)}
                placeholder="What deliverables or dates are at risk"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe the blocker and its impact on the project..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="resolutionPlan">Resolution Plan</Label>
            <Textarea
              id="resolutionPlan"
              value={formData.resolutionPlan}
              onChange={(e) => handleChange("resolutionPlan", e.target.value)}
              placeholder="Describe the plan to resolve this blocker..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes/Comments</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes or comments..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Reported Date</Label>
              <DatePicker
                value={formData.reportedDate}
                onChange={(date) => handleChange("reportedDate", date)}
                format="MMMM D, YYYY"
                placeholder="Select date"
              />
            </div>

            <div className="grid gap-2">
              <Label>Expected Resolution</Label>
              <DatePicker
                value={formData.expectedResolutionDate}
                onChange={(date) => handleChange("expectedResolutionDate", date)}
                format="MMMM D, YYYY"
                placeholder="Select date"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-black text-white hover:bg-gray-800">
            {loading ? "Adding..." : "Add Blocker"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
