"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DateRangePicker, type DateRange } from "@/components/ui/date-picker"
import { format } from "date-fns"
import { Loader2, Paperclip, Upload, File, Trash2 } from "lucide-react"
import { updateProjectTask } from "@/services/project-service"
import { getTeamMembers } from "@/services/team-member-service"
import { uploadTaskAttachment, deleteTaskAttachment } from "@/services/task-service"
import type { ProjectTask } from "@/types/project"
import type { TeamMember } from "@/types/team-member"
import type { TaskAttachment } from "@/types/task"
import { useToast } from "@/components/ui/use-toast"

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: ProjectTask | null
  projectId: string
  onUpdate: (updatedTask: ProjectTask) => void
  userId: string
}

export function TaskDetailModal({ isOpen, onClose, task, projectId, onUpdate, userId }: TaskDetailModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium")
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [assignedTo, setAssignedTo] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (task) {
      setName(task.name)
      setDescription(task.description || "")
      setPriority(task.priority || "Medium")
      setDateRange({
        from: new Date(task.startDate),
        to: new Date(task.endDate),
      })
      setAssignedTo(task.assignedTo || "")
      setAttachments(task.attachments || [])
    }
  }, [task])

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Fetch team members by owner ID instead of project ID
        const members = await getTeamMembers(userId)
        setTeamMembers(members)
      } catch (error) {
        console.error("Error fetching team members:", error)
      }
    }

    if (isOpen && userId) {
      fetchTeamMembers()
    }
  }, [isOpen, userId])

  const handleSave = async () => {
    if (!task) return

    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Task name is required",
        variant: "destructive",
      })
      return
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Error",
        description: "Start and end dates are required",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Get assigned team member name if ID is provided
      let assignedToName
      if (assignedTo) {
        const teamMember = teamMembers.find((m) => m.id === assignedTo)
        assignedToName = teamMember?.name
      }

      const startDate = format(dateRange.from, "yyyy-MM-dd")
      const endDate = format(dateRange.to, "yyyy-MM-dd")

      // Calculate duration in days
      const duration = Math.floor((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1

      const updatedTask = await updateProjectTask(projectId, task.id, {
        name,
        description,
        priority,
        startDate,
        endDate,
        duration,
        assignedTo,
        assignedToName,
        attachments,
      })

      onUpdate(updatedTask)
      onClose()
    } catch (error) {
      console.error("Error updating task:", error)
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUploadAttachment = async () => {
    if (!selectedFile || !task) return

    try {
      setUploadingAttachment(true)

      const newAttachment = await uploadTaskAttachment(projectId, task.id, selectedFile)

      // Update local state with the new attachment
      setAttachments([...attachments, newAttachment])

      // Reset file input
      setSelectedFile(null)

      toast({
        title: "Success",
        description: "Attachment uploaded successfully",
      })
    } catch (error) {
      console.error("Error uploading attachment:", error)
      toast({
        title: "Error",
        description: "Failed to upload attachment",
        variant: "destructive",
      })
    } finally {
      setUploadingAttachment(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!task) return

    try {
      await deleteTaskAttachment(projectId, task.id, attachmentId)

      // Update local state by removing the deleted attachment
      setAttachments(attachments.filter((attachment) => attachment.id !== attachmentId))

      toast({
        title: "Success",
        description: "Attachment deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast({
        title: "Error",
        description: "Failed to delete attachment",
        variant: "destructive",
      })
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return "image"
    if (fileType.includes("pdf")) return "pdf"
    if (fileType.includes("word") || fileType.includes("document")) return "doc"
    if (fileType.includes("excel") || fileType.includes("sheet")) return "sheet"
    if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "presentation"
    return "file"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Task Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup
              value={priority}
              onValueChange={(value) => setPriority(value as "Low" | "Medium" | "High")}
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

          <div className="space-y-2">
            <Label htmlFor="dateRange">Date Range</Label>
            <DateRangePicker
              dateRange={dateRange}
              setDateRange={setDateRange}
              placeholder={["Start date", "End date"]}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <select
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center">
              <Paperclip className="h-4 w-4 mr-2" />
              Attachments
            </Label>

            <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3">
              {/* File upload input */}
              <div className="flex items-center space-x-2 mb-3">
                <Input
                  type="file"
                  id="attachment"
                  onChange={handleFileChange}
                  className="flex-1"
                  disabled={uploadingAttachment}
                />
                <Button onClick={handleUploadAttachment} disabled={!selectedFile || uploadingAttachment} size="sm">
                  {uploadingAttachment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>

              {/* Attachments list */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {attachments && attachments.length > 0 ? (
                  attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                    >
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{attachment.fileName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(attachment.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAttachment(attachment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No attachments yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
