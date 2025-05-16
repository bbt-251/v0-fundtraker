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
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "@/lib/firebase/firebase-init"
import type { Document, DocumentFilter } from "@/types/document"

// Collection references
const documentsRef = collection(db, "documents")
const documentActivitiesRef = collection(db, "documentActivities")

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Helper function to get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || ""
}

// Helper function to get icon based on file extension
export const getFileIcon = (fileExtension: string): string => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "svg", "webp"]
  const spreadsheetExtensions = ["xls", "xlsx", "csv"]
  const documentExtensions = ["doc", "docx", "txt", "rtf", "odt"]
  const presentationExtensions = ["ppt", "pptx"]
  const codeExtensions = ["json", "xml", "html", "css", "js", "ts", "jsx", "tsx"]
  const archiveExtensions = ["zip", "rar", "7z", "tar", "gz"]
  const pdfExtension = ["pdf"]

  if (imageExtensions.includes(fileExtension)) return "image"
  if (spreadsheetExtensions.includes(fileExtension)) return "spreadsheet"
  if (documentExtensions.includes(fileExtension)) return "document"
  if (presentationExtensions.includes(fileExtension)) return "presentation"
  if (codeExtensions.includes(fileExtension)) return "code"
  if (archiveExtensions.includes(fileExtension)) return "archive"
  if (pdfExtension.includes(fileExtension)) return "pdf"

  return "file"
}

// Get content type based on file extension
export const getContentType = (fileExtension: string): string => {
  const contentTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    tar: "application/x-tar",
    gz: "application/gzip",
    mp4: "video/mp4",
    mp3: "audio/mpeg",
  }

  return contentTypes[fileExtension] || "application/octet-stream"
}

// Get all documents with optional filtering
export async function getDocuments(filter?: DocumentFilter): Promise<Document[]> {
  try {
    let q = documentsRef

    // Apply filters if provided
    if (filter) {
      q = query(q, orderBy("uploadedAt", "desc"))

      if (filter.projectId) {
        q = query(q, where("projectId", "==", filter.projectId))
      }

      if (filter.taskId) {
        q = query(q, where("taskId", "==", filter.taskId))
      }

      if (filter.fileType) {
        q = query(q, where("fileType", "==", filter.fileType))
      }

      if (filter.status) {
        q = query(q, where("status", "==", filter.status))
      }
    }

    const querySnapshot = await getDocs(q)
    const documents: Document[] = []

    querySnapshot.forEach((doc) => {
      documents.push({ id: doc.id, ...doc.data() } as Document)
    })

    // Apply search filter if provided (client-side filtering)
    if (filter?.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase()
      return documents.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
      )
    }

    return documents
  } catch (error) {
    console.error("Error getting documents:", error)
    throw error
  }
}

// Upload a document
export async function uploadDocument(
  file: File,
  metadata: Omit<Document, "id" | "fileUrl" | "fileType" | "fileSize">,
  onProgress?: (progress: number) => void,
): Promise<Document> {
  try {
    // Create a storage reference
    const storageRef = ref(storage, `documents/${metadata.projectId}/${Date.now()}_${file.name}`)

    // Upload file with progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, file)

    // Return a promise that resolves when the upload is complete
    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          if (onProgress) onProgress(progress)
        },
        (error) => {
          console.error("Upload failed:", error)
          reject(error)
        },
        async () => {
          try {
            // Get the download URL
            const fileUrl = await getDownloadURL(uploadTask.snapshot.ref)

            // Create document metadata in Firestore
            const docData: Omit<Document, "id"> = {
              ...metadata,
              fileUrl,
              fileType: file.type,
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
              version: 1,
              status: "draft",
            }

            const docRef = await addDoc(documentsRef, docData)

            // Return the complete document with ID
            resolve({ id: docRef.id, ...docData })
          } catch (error) {
            console.error("Error saving document metadata:", error)
            reject(error)
          }
        },
      )
    })
  } catch (error) {
    console.error("Error uploading document:", error)
    throw error
  }
}

// Update document metadata
export async function updateDocument(id: string, data: Partial<Document>): Promise<void> {
  try {
    const docRef = doc(db, "documents", id)
    await updateDoc(docRef, {
      ...data,
      lastModified: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error updating document:", error)
    throw error
  }
}

// Delete a document
export async function deleteDocument(document: Document): Promise<void> {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, "documents", document.id))

    // Delete from Storage
    if (document.fileUrl) {
      const storageRef = ref(storage, document.fileUrl)
      await deleteObject(storageRef)
    }
  } catch (error) {
    console.error("Error deleting document:", error)
    throw error
  }
}

// Get document by ID
export async function getDocumentById(id: string): Promise<Document | null> {
  try {
    const docRef = doc(db, "documents", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Document
    }

    return null
  } catch (error) {
    console.error("Error getting document by ID:", error)
    throw error
  }
}

// Add a document activity
export const addDocumentActivity = async (
  documentId: string,
  actionType: string,
  userId: string,
  userName: string,
  details?: string,
): Promise<void> => {
  try {
    await addDoc(documentActivitiesRef, {
      documentId,
      actionType,
      actionBy: {
        id: userId,
        name: userName,
      },
      actionDate: Timestamp.now(),
      details,
    })
  } catch (error) {
    console.error("Error adding document activity:", error)
    // Don't throw, as this is a non-critical operation
  }
}

// Get recent document activities
export const getRecentDocumentActivities = async (projectId: string, limit = 10): Promise<any[]> => {
  try {
    // First get all document IDs for the project
    const docsQuery = query(documentsRef, where("projectId", "==", projectId))
    const docsSnapshot = await getDocs(docsQuery)
    const documentIds = docsSnapshot.docs.map((doc) => doc.id)

    if (documentIds.length === 0) {
      return []
    }

    // Query activities for these documents
    const activitiesQuery = query(
      documentActivitiesRef,
      where("documentId", "in", documentIds),
      orderBy("actionDate", "desc"),
      limit(limit),
    )

    const activitiesSnapshot = await getDocs(activitiesQuery)

    return activitiesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error("Error getting recent document activities:", error)
    throw error
  }
}

// Get document statistics
export const getDocumentStatistics = async (projectId: string): Promise<any> => {
  try {
    // Get all documents for the project
    const documents = await getDocuments({ projectId })

    // Calculate total count
    const totalDocuments = documents.length

    // Group by type
    const typeCount: Record<string, number> = {}
    documents.forEach((doc) => {
      typeCount[doc.fileType] = (typeCount[doc.fileType] || 0) + 1
    })

    // Group by task
    const taskCount: Record<string, { name: string; count: number }> = {}
    documents.forEach((doc) => {
      if (doc.taskId) {
        if (!taskCount[doc.taskId]) {
          taskCount[doc.taskId] = { name: "", count: 0 }
        }
        taskCount[doc.taskId].count += 1
        // Use the first encountered task name
        if (!taskCount[doc.taskId].name && doc.taskName) {
          taskCount[doc.taskId].name = doc.taskName
        }
      }
    })

    // Get recent activities
    const recentActivity = await getRecentDocumentActivities(projectId)

    return {
      totalDocuments,
      typeCount,
      taskCount,
      recentActivity,
    }
  } catch (error) {
    console.error("Error getting document statistics:", error)
    throw error
  }
}

// Generate a unique document ID
export const generateDocumentId = (prefix = "DOC"): string => {
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")
  return `${prefix}-${timestamp}${random}`
}
