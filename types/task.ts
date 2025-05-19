export interface Task {
  id: string
  title: string
  description?: string
  status?: string
  assignedTo?: string
  assignedToId?: string
  dueDate?: string | Date
  priority?: string
  projectId?: string
  createdAt?: string | Date
  updatedAt?: string | Date
  taskId?: string // Added taskId field for display purposes (e.g., "TASK-001")
}
