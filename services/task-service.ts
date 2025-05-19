import { db, storage } from "@/lib/firebase/firebase"
import { collection, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { v4 as uuidv4 } from "uuid"
import type { Project, ProjectTask } from "@/types/project"
import type { Task, TaskAttachment } from "@/types/task"

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
      attachments: task.attachments || [],
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

/**
 * Upload an attachment for a task
 * @param projectId - The ID of the project
 * @param taskId - The ID of the task
 * @param file - The file to upload
 * @returns The uploaded attachment metadata
 */
export async function uploadTaskAttachment(projectId: string, taskId: string, file: File): Promise<TaskAttachment> {
  try {
    // Generate a unique ID for the attachment
    const attachmentId = uuidv4()

    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}_${file.name}`)

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file)

    // Get the download URL
    const fileUrl = await getDownloadURL(snapshot.ref)

    // Create attachment metadata
    const attachment: TaskAttachment = {
      id: attachmentId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUrl,
      uploadedAt: new Date().toISOString(),
    }

    // Update the task document with the new attachment
    const projectRef = doc(projectsCollection, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      throw new Error(`Project with ID ${projectId} not found`)
    }

    const projectData = projectSnap.data() as Project
    const taskIndex = projectData.tasks.findIndex((task) => task.id === taskId)

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found`)
    }

    // Update the task's attachments array
    await updateDoc(projectRef, {
      [`tasks.${taskIndex}.attachments`]: arrayUnion(attachment),
    })

    return attachment
  } catch (error) {
    console.error("Error uploading task attachment:", error)
    throw new Error("Failed to upload attachment")
  }
}

/**
 * Delete an attachment from a task
 * @param projectId - The ID of the project
 * @param taskId - The ID of the task
 * @param attachmentId - The ID of the attachment to delete
 */
export async function deleteTaskAttachment(projectId: string, taskId: string, attachmentId: string): Promise<void> {
  try {
    // Get the project document
    const projectRef = doc(projectsCollection, projectId)
    const projectSnap = await getDoc(projectRef)

    if (!projectSnap.exists()) {
      throw new Error(`Project with ID ${projectId} not found`)
    }

    const projectData = projectSnap.data() as Project
    const taskIndex = projectData.tasks.findIndex((task) => task.id === taskId)

    if (taskIndex === -1) {
      throw new Error(`Task with ID ${taskId} not found`)
    }

    // Find the attachment to delete
    const task = projectData.tasks[taskIndex]
    const attachment = task.attachments?.find((att) => att.id === attachmentId)

    if (!attachment) {
      throw new Error(`Attachment with ID ${attachmentId} not found`)
    }

    // Delete the file from Firebase Storage
    try {
      // Extract the file path from the URL or construct it
      const filePathMatch = attachment.fileUrl.match(/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\/([^?]+)/)
      if (filePathMatch) {
        const filePath = `projects/${projectId}/tasks/${taskId}/attachments/${filePathMatch[5]}`
        const fileRef = ref(storage, filePath)
        await deleteObject(fileRef)
      }
    } catch (storageError) {
      console.error("Error deleting file from storage:", storageError)
      // Continue with removing the attachment metadata even if storage deletion fails
    }

    // Remove the attachment from the task's attachments array
    await updateDoc(projectRef, {
      [`tasks.${taskIndex}.attachments`]: arrayRemove(attachment),
    })
  } catch (error) {
    console.error("Error deleting task attachment:", error)
    throw new Error("Failed to delete attachment")
  }
}
