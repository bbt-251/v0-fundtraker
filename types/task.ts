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
}
