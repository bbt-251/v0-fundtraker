import { db } from "@/lib/firebase/firebase-client"
import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
} from "firebase/firestore"
import type { Donation } from "@/types/donation"
import { updateProject } from "./project-service"

// Get donation by ID
export const getDonationById = async (donationId: string): Promise<Donation | null> => {
  try {
    const donationRef = doc(db, "donations", donationId)
    const donationSnap = await getDoc(donationRef)

    if (donationSnap.exists()) {
      const donationData = donationSnap.data() as Omit<Donation, "id">
      return {
        id: donationSnap.id,
        ...donationData,
        timestamp: donationData.timestamp
          ? new Date(donationData.timestamp.toDate()).toISOString()
          : new Date().toISOString(),
      }
    }

    return null
  } catch (error) {
    console.error("Error getting donation by ID:", error)
    return null
  }
}

// Collection reference
const donationsCollection = collection(db, "donations")

// Add a new donation
export async function createDonation(donation: Omit<Donation, "id" | "timestamp" | "status">): Promise<Donation> {
  try {
    // Create a clean donation object without undefined values
    const cleanDonation: Record<string, any> = {}

    // Add all defined properties to the clean object
    Object.entries(donation).forEach(([key, value]) => {
      if (value !== undefined) {
        cleanDonation[key] = value
      }
    })

    const donationData = {
      ...cleanDonation,
      timestamp: serverTimestamp(),
      status: "pending" as const,
    }

    const docRef = await addDoc(donationsCollection, donationData)
    const donationDoc = await getDoc(docRef)

    return { id: donationDoc.id, ...donationDoc.data() } as Donation
  } catch (error) {
    console.error("Error creating donation:", error)
    throw new Error("Failed to create donation")
  }
}

// Get all donations for a project
export async function getProjectDonations(projectId: string): Promise<Donation[]> {
  try {
    const q = query(
      donationsCollection,
      where("projectId", "==", projectId),
      where("status", "==", "completed"),
      orderBy("timestamp", "desc"),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Donation[]
  } catch (error) {
    console.error("Error getting project donations:", error)
    throw new Error("Failed to fetch project donations")
  }
}

// Get donations by user
export async function getUserDonations(userId: string): Promise<Donation[]> {
  try {
    const q = query(
      donationsCollection,
      where("userId", "==", userId),
      where("status", "==", "completed"),
      orderBy("timestamp", "desc"),
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Donation[]
  } catch (error) {
    console.error("Error getting user donations:", error)
    throw new Error("Failed to fetch user donations")
  }
}

// Update donation status
export async function updateDonationStatus(
  donationId: string,
  status: "pending" | "completed" | "failed",
): Promise<void> {
  try {
    const donationRef = doc(db, "donations", donationId)
    await updateDoc(donationRef, { status })
  } catch (error) {
    console.error("Error updating donation status:", error)
    throw new Error("Failed to update donation status")
  }
}

// Complete a donation and update project progress
export async function completeDonation(donationId: string, projectId: string): Promise<void> {
  try {
    // Update donation status
    await updateDonationStatus(donationId, "completed")

    // Get all completed donations for this project
    const donations = await getProjectDonations(projectId)

    // Calculate total amount donated
    const totalDonated = donations.reduce((sum, donation) => sum + donation.amount, 0)

    // Update project with new donation total
    await updateProject(projectId, { donations: totalDonated })
  } catch (error) {
    console.error("Error completing donation:", error)
    throw new Error("Failed to complete donation")
  }
}

// Get total donations for a project
export async function getProjectDonationTotal(projectId: string): Promise<number> {
  try {
    const donations = await getProjectDonations(projectId)
    return donations.reduce((sum, donation) => sum + donation.amount, 0)
  } catch (error) {
    console.error("Error calculating project donation total:", error)
    throw new Error("Failed to calculate donation total")
  }
}
