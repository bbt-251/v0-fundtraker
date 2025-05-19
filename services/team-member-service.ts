import { db } from "@/lib/firebase/firebase"
import { collection, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, getDocs } from "firebase/firestore"
import type { TeamMember, TeamMemberFormData } from "@/types/team-member"

// Collection reference
const teamMembersCollection = collection(db, "teamMembers")

// Get team members by owner ID
export async function getTeamMembers(ownerId?: string): Promise<TeamMember[]> {
  try {
    let q

    // Only use the where clause if ownerId is defined
    if (ownerId) {
      q = query(teamMembersCollection, where("ownerId", "==", ownerId))
    } else {
      // If ownerId is undefined, get all team members
      q = query(teamMembersCollection)
    }

    const querySnapshot = await getDocs(q)

    // Sort the results in memory after fetching
    const members = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TeamMember[]

    // Sort by createdAt in descending order
    return members.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error getting team members:", error)
    // Return empty array instead of throwing to prevent cascading failures
    return []
  }
}

// Get team member by ID
export async function getTeamMember(id: string): Promise<TeamMember | null> {
  try {
    const teamMemberRef = doc(db, "teamMembers", id)
    const teamMemberSnap = await getDoc(teamMemberRef)

    if (teamMemberSnap.exists()) {
      return {
        id: teamMemberSnap.id,
        ...teamMemberSnap.data(),
      } as TeamMember
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting team member:", error)
    throw new Error("Failed to fetch team member")
  }
}

// Create a new team member
export async function createTeamMember(teamMember: TeamMemberFormData, ownerId: string): Promise<TeamMember> {
  try {
    const newTeamMember = {
      ...teamMember,
      ownerId,
      createdAt: new Date().toISOString(),
    }

    const docRef = await addDoc(teamMembersCollection, newTeamMember)
    const docSnap = await getDoc(docRef)

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as TeamMember
  } catch (error) {
    console.error("Error creating team member:", error)
    throw new Error("Failed to create team member")
  }
}

// Update an existing team member
export async function updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<void> {
  try {
    const teamMemberRef = doc(db, "teamMembers", id)
    await updateDoc(teamMemberRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating team member:", error)
    throw new Error("Failed to update team member")
  }
}

// Delete a team member
export async function deleteTeamMember(id: string): Promise<void> {
  try {
    const teamMemberRef = doc(db, "teamMembers", id)
    await deleteDoc(teamMemberRef)
  } catch (error) {
    console.error("Error deleting team member:", error)
    throw new Error("Failed to delete team member")
  }
}

// Get team members assigned to a specific project
// This function is maintained for backward compatibility, but it now filters team members
// by their projectId field, not by assuming they're created per project
export async function getTeamMembersByProject(projectId?: string): Promise<TeamMember[]> {
  try {
    let q

    // Only use the where clause if projectId is defined
    if (projectId) {
      q = query(teamMembersCollection, where("projectId", "==", projectId))
    } else {
      // If projectId is undefined, get all team members
      q = query(teamMembersCollection)
    }

    const querySnapshot = await getDocs(q)

    // Sort the results in memory
    const members = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TeamMember[]

    // Sort by createdAt in descending order
    return members.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime()
      const dateB = new Date(b.createdAt || 0).getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error getting team members by project:", error)
    // Return empty array instead of throwing to prevent cascading failures
    return []
  }
}
