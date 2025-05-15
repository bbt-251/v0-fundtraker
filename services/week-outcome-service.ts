import { db } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import type { WeekOutcome, WeekOutcomeFormData } from "@/types/week-outcome"

// Collection reference
const weekOutcomesCollection = collection(db, "weekOutcomes")

// Get all week outcomes for a project
export async function getWeekOutcomesByProject(projectId: string): Promise<WeekOutcome[]> {
  try {
    const q = query(weekOutcomesCollection, where("projectId", "==", projectId), orderBy("weekOf", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as WeekOutcome[]
  } catch (error) {
    console.error("Error getting week outcomes:", error)
    throw new Error("Failed to fetch week outcomes")
  }
}

// Get a specific week outcome by ID
export async function getWeekOutcome(id: string): Promise<WeekOutcome | null> {
  try {
    const weekOutcomeRef = doc(db, "weekOutcomes", id)
    const weekOutcomeSnap = await getDoc(weekOutcomeRef)

    if (weekOutcomeSnap.exists()) {
      return {
        id: weekOutcomeSnap.id,
        ...weekOutcomeSnap.data(),
      } as WeekOutcome
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting week outcome:", error)
    throw new Error("Failed to fetch week outcome")
  }
}

// Create a new week outcome
export async function createWeekOutcome(data: WeekOutcomeFormData): Promise<WeekOutcome> {
  try {
    // Calculate activity completion rate
    const activityCompletionRate = Math.round((data.activitiesCompleted / data.activitiesPlanned) * 100)

    // Prepare upcoming deliverables with IDs
    const upcomingDeliverables = data.upcomingDeliverables.map((deliverable) => ({
      ...deliverable,
      id: deliverable.id || uuidv4(),
    }))

    const weekOutcomeData = {
      ...data,
      activityCompletionRate,
      upcomingDeliverables,
      createdAt: serverTimestamp(),
    }

    const docRef = await addDoc(weekOutcomesCollection, weekOutcomeData)
    const docSnap = await getDoc(docRef)

    return {
      id: docRef.id,
      ...docSnap.data(),
    } as WeekOutcome
  } catch (error) {
    console.error("Error creating week outcome:", error)
    throw new Error("Failed to create week outcome")
  }
}

// Update an existing week outcome
export async function updateWeekOutcome(id: string, data: Partial<WeekOutcomeFormData>): Promise<void> {
  try {
    const weekOutcomeRef = doc(db, "weekOutcomes", id)

    // If activities data is updated, recalculate completion rate
    const updates: any = { ...data }

    if (data.activitiesCompleted !== undefined && data.activitiesPlanned !== undefined) {
      updates.activityCompletionRate = Math.round((data.activitiesCompleted / data.activitiesPlanned) * 100)
    } else if (data.activitiesCompleted !== undefined) {
      // Get current planned activities
      const weekOutcomeSnap = await getDoc(weekOutcomeRef)
      if (weekOutcomeSnap.exists()) {
        const currentData = weekOutcomeSnap.data()
        updates.activityCompletionRate = Math.round((data.activitiesCompleted / currentData.activitiesPlanned) * 100)
      }
    } else if (data.activitiesPlanned !== undefined) {
      // Get current completed activities
      const weekOutcomeSnap = await getDoc(weekOutcomeRef)
      if (weekOutcomeSnap.exists()) {
        const currentData = weekOutcomeSnap.data()
        updates.activityCompletionRate = Math.round((currentData.activitiesCompleted / data.activitiesPlanned) * 100)
      }
    }

    updates.updatedAt = serverTimestamp()

    await updateDoc(weekOutcomeRef, updates)
  } catch (error) {
    console.error("Error updating week outcome:", error)
    throw new Error("Failed to update week outcome")
  }
}

// Delete a week outcome
export async function deleteWeekOutcome(id: string): Promise<void> {
  try {
    const weekOutcomeRef = doc(db, "weekOutcomes", id)
    await deleteDoc(weekOutcomeRef)
  } catch (error) {
    console.error("Error deleting week outcome:", error)
    throw new Error("Failed to delete week outcome")
  }
}
