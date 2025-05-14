import { db } from "@/lib/firebase/firebase"
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from "firebase/firestore"
import type { Blocker, BlockerFormData, BlockerStatus } from "@/types/blocker"
import { auth } from "@/lib/firebase/firebase"

// Collection reference
const blockersCollection = collection(db, "blockers")

// Get blockers by status
export async function getBlockersByStatus(status: BlockerStatus): Promise<Blocker[]> {
  try {
    const q = query(blockersCollection, where("status", "==", status), orderBy("reportedDate", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportedDate: doc.data().reportedDate?.toDate?.() || doc.data().reportedDate,
      expectedResolutionDate: doc.data().expectedResolutionDate?.toDate?.() || doc.data().expectedResolutionDate,
      resolvedDate: doc.data().resolvedDate?.toDate?.() || doc.data().resolvedDate,
    })) as Blocker[]
  } catch (error) {
    console.error("Error getting blockers:", error)
    throw new Error("Failed to fetch blockers")
  }
}

// Get blocker by ID
export async function getBlocker(id: string): Promise<Blocker | null> {
  try {
    const blockerRef = doc(db, "blockers", id)
    const blockerSnap = await getDoc(blockerRef)

    if (blockerSnap.exists()) {
      const data = blockerSnap.data()
      return {
        id: blockerSnap.id,
        ...data,
        reportedDate: data.reportedDate?.toDate?.() || data.reportedDate,
        expectedResolutionDate: data.expectedResolutionDate?.toDate?.() || data.expectedResolutionDate,
        resolvedDate: data.resolvedDate?.toDate?.() || data.resolvedDate,
      } as Blocker
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting blocker:", error)
    throw new Error("Failed to fetch blocker")
  }
}

// Create a new blocker
export async function createBlocker(blockerData: BlockerFormData): Promise<Blocker> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("User not authenticated")
    }

    const newBlocker = {
      ...blockerData,
      status: "Active" as BlockerStatus,
      reportedById: currentUser.uid,
      reportedBy: currentUser.displayName || "Unknown User",
      reportedDate: serverTimestamp(),
      previouslyResolved: false,
    }

    const docRef = await addDoc(blockersCollection, newBlocker)
    const docSnap = await getDoc(docRef)

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      reportedDate: data?.reportedDate?.toDate?.() || data?.reportedDate || new Date(),
      expectedResolutionDate: data?.expectedResolutionDate?.toDate?.() || data?.expectedResolutionDate || new Date(),
    } as Blocker
  } catch (error) {
    console.error("Error creating blocker:", error)
    throw new Error("Failed to create blocker")
  }
}

// Resolve a blocker
export async function resolveBlocker(id: string, resolutionNotes: string): Promise<void> {
  try {
    const blockerRef = doc(db, "blockers", id)
    await updateDoc(blockerRef, {
      status: "Resolved",
      resolvedDate: serverTimestamp(),
      resolutionNotes,
    })
  } catch (error) {
    console.error("Error resolving blocker:", error)
    throw new Error("Failed to resolve blocker")
  }
}

// Reactivate a blocker
export async function reactivateBlocker(id: string): Promise<void> {
  try {
    const blockerRef = doc(db, "blockers", id)
    await updateDoc(blockerRef, {
      status: "Active",
      resolvedDate: null,
      previouslyResolved: true,
    })
  } catch (error) {
    console.error("Error reactivating blocker:", error)
    throw new Error("Failed to reactivate blocker")
  }
}

// Get blockers by project ID
export async function getBlockersByProject(projectId: string): Promise<Blocker[]> {
  try {
    const q = query(blockersCollection, where("projectId", "==", projectId), orderBy("reportedDate", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      reportedDate: doc.data().reportedDate?.toDate?.() || doc.data().reportedDate,
      expectedResolutionDate: doc.data().expectedResolutionDate?.toDate?.() || doc.data().expectedResolutionDate,
      resolvedDate: doc.data().resolvedDate?.toDate?.() || doc.data().resolvedDate,
    })) as Blocker[]
  } catch (error) {
    console.error("Error getting blockers by project:", error)
    throw new Error("Failed to fetch blockers by project")
  }
}
