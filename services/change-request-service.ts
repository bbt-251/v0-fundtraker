import { db } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore"
import type { ChangeRequest } from "@/types/change-request"

// Collection reference
const changeRequestsCollection = collection(db, "changeRequests")

// Get change requests by project ID
export async function getChangeRequestsByProject(projectId: string): Promise<ChangeRequest[]> {
  try {
    const q = query(changeRequestsCollection, where("projectId", "==", projectId), orderBy("createdAt", "desc"))

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ChangeRequest[]
  } catch (error) {
    console.error("Error getting change requests:", error)
    throw new Error("Failed to fetch change requests")
  }
}

// Get change request by ID
export async function getChangeRequest(id: string): Promise<ChangeRequest | null> {
  try {
    const changeRequestRef = doc(db, "changeRequests", id)
    const changeRequestSnap = await getDoc(changeRequestRef)

    if (changeRequestSnap.exists()) {
      return {
        id: changeRequestSnap.id,
        ...changeRequestSnap.data(),
      } as ChangeRequest
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting change request:", error)
    throw new Error("Failed to fetch change request")
  }
}

// Create a new change request
export async function createChangeRequest(
  changeRequest: Omit<ChangeRequest, "id" | "createdAt">,
): Promise<ChangeRequest> {
  try {
    const docRef = await addDoc(changeRequestsCollection, {
      ...changeRequest,
      createdAt: serverTimestamp(),
    })

    const docSnap = await getDoc(docRef)
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as ChangeRequest
  } catch (error) {
    console.error("Error creating change request:", error)
    throw new Error("Failed to create change request")
  }
}

// Update an existing change request
export async function updateChangeRequest(id: string, updates: Partial<ChangeRequest>): Promise<void> {
  try {
    const changeRequestRef = doc(db, "changeRequests", id)
    await updateDoc(changeRequestRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating change request:", error)
    throw new Error("Failed to update change request")
  }
}

// Delete a change request
export async function deleteChangeRequest(id: string): Promise<void> {
  try {
    const changeRequestRef = doc(db, "changeRequests", id)
    await deleteDoc(changeRequestRef)
  } catch (error) {
    console.error("Error deleting change request:", error)
    throw new Error("Failed to delete change request")
  }
}

// Generate a change request ID
export function generateChangeRequestId(existingIds: string[] = []): string {
  let counter = 1
  let newId = `CR-${String(counter).padStart(3, "0")}`

  // Find the highest number in existing IDs
  existingIds.forEach((id) => {
    const match = id.match(/CR-(\d+)/)
    if (match && match[1]) {
      const num = Number.parseInt(match[1], 10)
      if (num >= counter) {
        counter = num + 1
      }
    }
  })

  newId = `CR-${String(counter).padStart(3, "0")}`
  return newId
}
