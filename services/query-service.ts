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
  limit,
} from "firebase/firestore"
import type { Query, QueryFormData, QueryStatus } from "@/types/query"
import { auth } from "@/lib/firebase/firebase"

// Collection reference
const queriesCollection = collection(db, "queries")

// Get all queries
export async function getQueries(projectId?: string): Promise<Query[]> {
  try {
    let q = query(queriesCollection, orderBy("dateRaised", "desc"))

    if (projectId) {
      q = query(queriesCollection, where("projectId", "==", projectId), orderBy("dateRaised", "desc"))
    }

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.data().id || doc.id, // Use the custom ID field or fallback to Firestore ID
      docId: doc.id, // Store the Firestore document ID
      ...doc.data(),
      dateRaised: doc.data().dateRaised?.toDate?.() || doc.data().dateRaised,
      responseDate: doc.data().responseDate?.toDate?.() || doc.data().responseDate,
    })) as Query[]
  } catch (error) {
    console.error("Error getting queries:", error)
    throw new Error("Failed to fetch queries")
  }
}

// Get queries by status
export async function getQueriesByStatus(status: QueryStatus, projectId?: string): Promise<Query[]> {
  try {
    let q = query(queriesCollection, where("status", "==", status), orderBy("dateRaised", "desc"))

    if (projectId) {
      q = query(
        queriesCollection,
        where("projectId", "==", projectId),
        where("status", "==", status),
        orderBy("dateRaised", "desc"),
      )
    }

    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => ({
      id: doc.data().id || doc.id,
      docId: doc.id,
      ...doc.data(),
      dateRaised: doc.data().dateRaised?.toDate?.() || doc.data().dateRaised,
      responseDate: doc.data().responseDate?.toDate?.() || doc.data().responseDate,
    })) as Query[]
  } catch (error) {
    console.error("Error getting queries by status:", error)
    throw new Error("Failed to fetch queries")
  }
}

// Get query by ID
export async function getQuery(id: string): Promise<Query | null> {
  try {
    // First try to find by custom ID
    const q = query(queriesCollection, where("id", "==", id), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      const data = doc.data()
      return {
        id: data.id || doc.id,
        docId: doc.id,
        ...data,
        dateRaised: data.dateRaised?.toDate?.() || data.dateRaised,
        responseDate: data.responseDate?.toDate?.() || data.responseDate,
      } as Query
    }

    // If not found by custom ID, try direct document ID
    const queryRef = doc(db, "queries", id)
    const querySnap = await getDoc(queryRef)

    if (querySnap.exists()) {
      const data = querySnap.data()
      return {
        id: data.id || querySnap.id,
        docId: querySnap.id,
        ...data,
        dateRaised: data.dateRaised?.toDate?.() || data.dateRaised,
        responseDate: data.responseDate?.toDate?.() || data.responseDate,
      } as Query
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting query:", error)
    throw new Error("Failed to fetch query")
  }
}

// Find document ID by query ID
async function findDocumentIdByQueryId(queryId: string): Promise<string | null> {
  try {
    const q = query(queriesCollection, where("id", "==", queryId), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id
    }

    return null
  } catch (error) {
    console.error("Error finding document ID:", error)
    throw new Error("Failed to find document")
  }
}

// Generate a new query ID
export async function generateQueryId(): Promise<string> {
  try {
    // Get the count of existing queries
    const querySnapshot = await getDocs(queriesCollection)
    const count = querySnapshot.size + 1

    // Format the ID as Q-001, Q-002, etc.
    return `Q-${count.toString().padStart(3, "0")}`
  } catch (error) {
    console.error("Error generating query ID:", error)
    throw new Error("Failed to generate query ID")
  }
}

// Create a new query
export async function createQuery(queryData: QueryFormData): Promise<Query> {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("User not authenticated")
    }

    // Generate a new query ID
    const queryId = await generateQueryId()

    const newQuery = {
      id: queryId, // Store our custom ID as a field
      ...queryData,
      dateRaised: serverTimestamp(),
    }

    const docRef = await addDoc(queriesCollection, newQuery)
    const docSnap = await getDoc(docRef)

    const data = docSnap.data()
    return {
      id: queryId,
      docId: docRef.id, // Store the Firestore document ID
      ...data,
      dateRaised: data?.dateRaised?.toDate?.() || data?.dateRaised || new Date(),
    } as Query
  } catch (error) {
    console.error("Error creating query:", error)
    throw new Error("Failed to create query")
  }
}

// Update a query
export async function updateQuery(id: string, updates: Partial<Query>): Promise<void> {
  try {
    // Find the document ID by query ID
    const docId = await findDocumentIdByQueryId(id)

    if (!docId) {
      throw new Error(`No document found with query ID: ${id}`)
    }

    const queryRef = doc(db, "queries", docId)

    // If updating status to "Responded", add response date
    if (updates.status === "Responded" && !updates.responseDate) {
      updates.responseDate = serverTimestamp()
    }

    await updateDoc(queryRef, updates)
  } catch (error) {
    console.error("Error updating query:", error)
    throw new Error(`Failed to update query: ${error.message}`)
  }
}

// Respond to a query
export async function respondToQuery(
  id: string,
  response: string,
  status: QueryStatus = "Responded",
  dateResolved?: Date,
): Promise<void> {
  try {
    // Find the document ID by query ID
    const docId = await findDocumentIdByQueryId(id)

    if (!docId) {
      throw new Error(`No document found with query ID: ${id}`)
    }

    const queryRef = doc(db, "queries", docId)

    const updates: any = {
      status,
      response,
      responseDate: serverTimestamp(),
    }

    if (dateResolved && status === "Resolved") {
      updates.dateResolved = dateResolved
    }

    await updateDoc(queryRef, updates)
  } catch (error) {
    console.error("Error responding to query:", error)
    throw new Error(`Failed to respond to query: ${error.message}`)
  }
}

// Resolve a query
export async function resolveQuery(id: string): Promise<void> {
  try {
    // Find the document ID by query ID
    const docId = await findDocumentIdByQueryId(id)

    if (!docId) {
      throw new Error(`No document found with query ID: ${id}`)
    }

    const queryRef = doc(db, "queries", docId)
    await updateDoc(queryRef, {
      status: "Resolved",
      dateResolved: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error resolving query:", error)
    throw new Error(`Failed to resolve query: ${error.message}`)
  }
}

// Escalate a query
export async function escalateQuery(id: string): Promise<void> {
  try {
    // Find the document ID by query ID
    const docId = await findDocumentIdByQueryId(id)

    if (!docId) {
      throw new Error(`No document found with query ID: ${id}`)
    }

    const queryRef = doc(db, "queries", docId)
    await updateDoc(queryRef, {
      status: "Escalated",
    })
  } catch (error) {
    console.error("Error escalating query:", error)
    throw new Error(`Failed to escalate query: ${error.message}`)
  }
}
