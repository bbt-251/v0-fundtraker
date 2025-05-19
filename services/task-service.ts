import { db } from "@/lib/firebase/firebase"
import { collection, doc, getDoc } from "firebase/firestore"
import type { Project, ProjectTask } from "@/types/project"
import type { Task } from "@/types/task"

// Collection reference
const projectsCollection = collection(db, "projects")

/**
 * Get tasks by project ID
 * @param projectId - The ID of the project
 * @returns Array of tasks for the project
 */
export async function getTasks(projectId: string): Promise<Task[]> {
  try {
    // Get the project document
    const projectRef = doc(projectsCollection, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      console.error(`Project with ID ${projectId} not found`)
      return []
    }

    // Get the project data
    const projectData = projectSnap.data() as Project

    // Extract tasks from the project
    const projectTasks = projectData.tasks || []

    // Convert ProjectTask to Task format
    return projectTasks.map((task: ProjectTask) => ({
      id: task.id,
      title: task.name,
      description: task.description,
      status: task.status,
      assignedTo: task.resources?.[0]?.resourceId, // Simplified - using first resource
      assignedToId: task.resources?.[0]?.resourceId,
      dueDate: task.endDate,
      priority: task.priority,
      projectId: projectId,
      createdAt: task.createdAt || new Date().toISOString(),
      taskId: `TASK-${String(projectTasks.indexOf(task) + 1).padStart(3, "0")}`,
    }))
  } catch (error) {
    console.error("Error getting tasks:", error)
    throw new Error("Failed to fetch tasks")
  }
}

/**
 * Get task by ID
 * @param projectId - The ID of the project
 * @param taskId - The ID of the task
 * @returns The task or null if not found
 */
export async function getTask(projectId: string, taskId: string): Promise<Task | null> {
  try {
    // Get all tasks for the project
    const tasks = await getTasks(projectId)

    // Find the specific task
    const task = tasks.find((t) => t.id === taskId) || null

    return task
  } catch (error) {
    console.error("Error getting task:", error)
    throw new Error("Failed to fetch task")
  }
}

/**
 * Get all tasks across all projects
 * @returns Array of all tasks
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    // This would require fetching all projects and extracting their tasks
    // This could be inefficient for large datasets
    console.warn("getAllTasks may be inefficient for large datasets")

    // For now, we'll return an empty array
    // In a real implementation, you might want to create a separate tasks collection
    // or implement pagination for better performance
    return []
  } catch (error) {
    console.error("Error getting all tasks:", error)
    throw new Error("Failed to fetch all tasks")
  }
}
