"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { uploadDocument } from "@/services/document-service"
import { useAuth } from "@/contexts/auth-context"
import { getProjects } from "@/services/project-service"
import { getTasks } from "@/services/task-service"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

interface UploadDocumentDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
  initialProjectId?: string
  initialTaskId?: string
}

export function UploadDocumentDialog({
  isOpen,
  onClose,
  onUploadComplete,
  initialProjectId,
  initialTaskId,
}: UploadDocumentDialogProps) {
  const { user, userProfile } = useAuth()

  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState(initialProjectId || "")
  const [taskId, setTaskId] = useState(initialTaskId || "")
  const [tags, setTags] = useState("")

  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoading(true)
        const projectsData = await getProjects()
        setProjects(projectsData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading projects:", error)
        setIsLoading(false)
      }
    }

    if (isOpen) {
      loadProjects()
    }
  }, [isOpen])

  // Load tasks when project changes
  useEffect(() => {
    const loadTasks = async () => {
      if (!projectId) {
        setTasks([])
        return
      }

      try {
        setIsLoading(true)
        const tasksData = await getTasks(projectId)
        setTasks(tasksData)
        setIsLoading(false)
      } catch (error) {
        console.error("Error loading tasks:", error)
        setIsLoading(false)
      }
    }

    if (projectId) {
      loadTasks()
    }
  }, [projectId])

  // Set initial values when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialProjectId) setProjectId(initialProjectId)
      if (initialTaskId) setTaskId(initialTaskId)

      // Reset form when dialog opens
      setFile(null)
      setName("")
      setDescription("")
      setTags("")
      setUploadProgress(0)
    }
  }, [isOpen, initialProjectId, initialTaskId])

  // Update name when file changes
  useEffect(() => {
    if (file) {
      setName(file.name)
    }
  }, [file])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!file || !projectId || !user) return

    try {
      setIsUploading(true)

      await uploadDocument(
        file,
        {
          name,
          description,
          projectId,
          taskId: taskId || undefined,
          uploadedBy: user.email || "Unknown",
          tags: tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag),
        },
        (progress) => {
          setUploadProgress(progress)
        },
      )

      onUploadComplete()
      onClose()
    } catch (error) {
      console.error("Error uploading document:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input id="file" type="file" onChange={handleFileChange} disabled={isUploading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Document Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isUploading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <select
              id="project"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value)
                setTaskId("") // Reset task when project changes
              }}
              disabled={isLoading || isUploading || !!initialProjectId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="task">Task (Optional)</Label>
            <select
              id="task"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              disabled={isLoading || isUploading || !projectId || !!initialTaskId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select a task</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated, optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3"
              disabled={isUploading}
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-right">{Math.round(uploadProgress)}%</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !file || !name.trim() || !projectId}>
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
