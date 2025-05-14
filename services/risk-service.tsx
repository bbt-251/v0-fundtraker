import { db } from "@/lib/firebase/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import type { ProjectRisk } from "@/types/project"

// Collection reference
const risksCollection = collection(db, "risks")

// Get all risks
export async function getRisks(): Promise<ProjectRisk[]> {
  try {
    const q = query(risksCollection, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProjectRisk[]
  } catch (error) {
    console.error("Error getting risks:", error)
    throw new Error("Failed to fetch risks")
  }
}
