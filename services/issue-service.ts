import { db } from "@/lib/firebase/firebase-init"
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  where,
  deleteDoc,
  Timestamp,
} from "firebase/firestore"
import type { Issue, IssueFormData } from "@/types/issue"
import { DEFAULT_IMPACT_AREAS } from "@/lib/default-data"

const ISSUES_COLLECTION = "issues"

// Helper function to convert Firestore data to Issue object
const convertToIssue = (doc: any): Issue => {
  const data = doc.data()
  return {
    ...data,
    id: data.id,
    docId: doc.id,
    dateRaised: data.dateRaised.toDate(),
    dateResolved: data.dateResolved ? data.dateResolved.toDate() : undefined,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  }
}

// Get all issues
export const getIssues = async (): Promise<Issue[]> => {
  try {
    const issuesQuery = query(collection(db, ISSUES_COLLECTION), orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(issuesQuery)

    return querySnapshot.docs.map(convertToIssue)
  } catch (error) {
    console.error("Error getting issues:", error)
    throw new Error(`Failed to get issues: ${error}`)
  }
}

// Find document ID by issue ID
export const findDocumentIdByIssueId = async (issueId: string): Promise<string | null> => {
  try {
    const issuesQuery = query(collection(db, ISSUES_COLLECTION), where("id", "==", issueId))
    const querySnapshot = await getDocs(issuesQuery)

    if (querySnapshot.empty) {
      return null
    }

    return querySnapshot.docs[0].id
  } catch (error) {
    console.error("Error finding document by issue ID:", error)
    throw new Error(`Failed to find document: ${error}`)
  }
}

// Generate a new issue ID
export const generateIssueId = async (): Promise<string> => {
  try {
    const year = new Date().getFullYear()
    const issuesQuery = query(
      collection(db, ISSUES_COLLECTION),
      where("id", ">=", `IS-${year}-`),
      where("id", "<", `IS-${year + 1}-`),
    )
    const querySnapshot = await getDocs(issuesQuery)

    const count = querySnapshot.size + 1
    return `IS-${year}-${count.toString().padStart(3, "0")}`
  } catch (error) {
    console.error("Error generating issue ID:", error)
    // Fallback to random ID if query fails
    const year = new Date().getFullYear()
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `IS-${year}-${randomNum}`
  }
}

// Create a new issue
export const createIssue = async (issueData: IssueFormData): Promise<Issue> => {
  try {
    const now = new Date()

    const newIssue = {
      ...issueData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      dateRaised: Timestamp.fromDate(issueData.dateRaised),
      dateResolved: issueData.dateResolved ? Timestamp.fromDate(issueData.dateResolved) : null,
    }

    const docRef = await addDoc(collection(db, ISSUES_COLLECTION), newIssue)

    return {
      ...issueData,
      docId: docRef.id,
      createdAt: now,
      updatedAt: now,
    }
  } catch (error) {
    console.error("Error creating issue:", error)
    throw new Error(`Failed to create issue: ${error}`)
  }
}

// Update an issue
export const updateIssue = async (
  issueId: string,
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated",
  resolution: string,
  assignedTo: string,
  dateResolved?: Date,
  comments?: string,
): Promise<Issue> => {
  try {
    const docId = await findDocumentIdByIssueId(issueId)

    if (!docId) {
      throw new Error(`Issue with ID ${issueId} not found`)
    }

    const issueRef = doc(db, ISSUES_COLLECTION, docId)
    const issueSnap = await getDoc(issueRef)

    if (!issueSnap.exists()) {
      throw new Error(`Issue document with ID ${docId} not found`)
    }

    const issueData = issueSnap.data()
    const now = new Date()

    const updateData: any = {
      status,
      resolution,
      assignedTo,
      comments,
      updatedAt: Timestamp.fromDate(now),
    }

    if (dateResolved) {
      updateData.dateResolved = Timestamp.fromDate(dateResolved)
    }

    await updateDoc(issueRef, updateData)

    const updatedIssue: Issue = {
      ...convertToIssue(issueSnap),
      ...updateData,
      dateResolved,
      updatedAt: now,
    }

    return updatedIssue
  } catch (error) {
    console.error("Error updating issue:", error)
    throw new Error(`Failed to update issue: ${error}`)
  }
}

// Delete an issue
export const deleteIssue = async (issueId: string): Promise<void> => {
  try {
    const docId = await findDocumentIdByIssueId(issueId)

    if (!docId) {
      throw new Error(`Issue with ID ${issueId} not found`)
    }

    await deleteDoc(doc(db, ISSUES_COLLECTION, docId))
  } catch (error) {
    console.error("Error deleting issue:", error)
    throw new Error(`Failed to delete issue: ${error}`)
  }
}

// Get impact areas
export const getImpactAreas = async (): Promise<string[]> => {
  try {
    const issues = await getIssues()
    const areas = new Set<string>(DEFAULT_IMPACT_AREAS)

    issues.forEach((issue) => {
      if (issue.impactArea) {
        areas.add(issue.impactArea)
      }
    })

    return Array.from(areas).sort()
  } catch (error) {
    console.error("Error getting impact areas:", error)
    return DEFAULT_IMPACT_AREAS
  }
}
