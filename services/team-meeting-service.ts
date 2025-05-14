import { db } from "@/lib/firebase/firebase-client"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore"
import type { TeamMeeting, TeamMeetingFormData } from "@/types/team-meeting"

const COLLECTION_NAME = "teamMeetings"

// Create a new team meeting
export async function createTeamMeeting(
  projectId: string,
  meetingData: TeamMeetingFormData,
  userId: string,
): Promise<string> {
  try {
    const dateISOString = meetingData.date.toISOString()

    const newMeeting = {
      projectId,
      ...meetingData,
      date: dateISOString,
      createdAt: Timestamp.now().toDate().toISOString(),
      updatedAt: Timestamp.now().toDate().toISOString(),
      createdBy: userId,
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newMeeting)
    return docRef.id
  } catch (error) {
    console.error("Error creating team meeting:", error)
    throw error
  }
}

// Get all team meetings for a project
export async function getTeamMeetings(projectId: string): Promise<TeamMeeting[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("projectId", "==", projectId),
      orderBy("date", "desc"),
      orderBy("startTime", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const meetings: TeamMeeting[] = []

    querySnapshot.forEach((doc) => {
      meetings.push({
        id: doc.id,
        ...doc.data(),
      } as TeamMeeting)
    })

    return meetings
  } catch (error) {
    console.error("Error getting team meetings:", error)
    throw error
  }
}

// Get a single team meeting by ID
export async function getTeamMeeting(meetingId: string): Promise<TeamMeeting | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, meetingId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as TeamMeeting
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting team meeting:", error)
    throw error
  }
}

// Update a team meeting
export async function updateTeamMeeting(meetingId: string, meetingData: Partial<TeamMeetingFormData>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, meetingId)

    // Convert date to ISO string if it exists
    const updateData = { ...meetingData }
    if (updateData.date) {
      updateData.date = updateData.date.toISOString()
    }

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now().toDate().toISOString(),
    })
  } catch (error) {
    console.error("Error updating team meeting:", error)
    throw error
  }
}

// Delete a team meeting
export async function deleteTeamMeeting(meetingId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, meetingId)
    await deleteDoc(docRef)
  } catch (error) {
    console.error("Error deleting team meeting:", error)
    throw error
  }
}

// Update meeting status
export async function updateMeetingStatus(
  meetingId: string,
  status: "scheduled" | "completed" | "cancelled",
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, meetingId)
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now().toDate().toISOString(),
    })
  } catch (error) {
    console.error("Error updating meeting status:", error)
    throw error
  }
}
