import { db } from "@/lib/firebase/firebase"
import { collection, doc, getDoc, getDocs, query, where, orderBy } from "firebase/firestore"
import type { Task } from "@/types/task"

// Collection reference
const tasksCollection = collection(db, "tasks")

// Get tasks by project ID
export async function getTasks(projectId: string): Promise<Task[]> {
  try {
    const q = query(tasksCollection, where("projectId", "==", projectId), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[]
  } catch (error) {
    console.error("Error getting tasks:", error)
    throw new Error("Failed to fetch tasks")
  }
}

// Get task by ID
export async function getTask(id: string): Promise<Task | null> {
  try {
    const taskRef = doc(db, "tasks", id)
    const taskSnap = await getDoc(taskRef)

    if (taskSnap.exists()) {
      return {
        id: taskSnap.id,
        ...taskSnap.data(),
      } as Task
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting task:", error)
    throw new Error("Failed to fetch task")
  }
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  try {
    const q = query(tasksCollection, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[]
  } catch (error) {
    console.error("Error getting all tasks:", error)
    throw new Error("Failed to fetch all tasks")
  }
}
