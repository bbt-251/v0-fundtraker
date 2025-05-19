export interface Task {
  id: string
  taskId?: string
  title: string
  description?: string
  status: string
  assignedTo?: string
  assignedToId?: string
  dueDate?: string
  priority?: string
  projectId: string
  createdAt: string
  attachments?: TaskAttachment[]
}

export interface TaskAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  uploadedAt: string
}
