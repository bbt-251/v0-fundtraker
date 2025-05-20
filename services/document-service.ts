"use client"

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
    Query,
    DocumentData,
} from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { getFirebaseServices } from "@/lib/firebase/firebase-client"
import type { Document, DocumentActivity, DocumentFilter, DocumentStatistics } from "@/types/document"

// Collection references
const documentsRef = collection(getFirebaseServices().db, "documents")
const documentActivitiesRef = collection(getFirebaseServices().db, "documentActivities")

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
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        const documentsCollection = collection(db, "documents")

        // Start with a base query
        let q: Query<DocumentData> = documentsCollection

        // Apply filters if provided
        if (filter) {
            // Create a query with all the filters
            const constraints = []

            if (filter.projectId) {
                constraints.push(where("projectId", "==", filter.projectId))
            }

            if (filter.taskId) {
                constraints.push(where("taskId", "==", filter.taskId))
            }

            if (filter.fileType) {
                constraints.push(where("fileType", "==", filter.fileType))
            }

            if (filter.status) {
                constraints.push(where("status", "==", filter.status))
            } else {
                // By default, only show active documents
                constraints.push(where("status", "==", "active"))
            }

            // Add ordering
            constraints.push(orderBy("uploadedAt", "desc"))

            // Apply all constraints to the query
            q = query(documentsCollection, ...constraints) as Query<DocumentData>
        } else {
            // Default query with just ordering
            q = query(documentsCollection, orderBy("uploadedAt", "desc"))
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
        return []
    }
}

// Upload a document
export async function uploadDocument(
    file: File,
    metadata: {
        name: string
        description?: string
        projectId: string
        taskId?: string
        tags?: string[]
        uploadedBy: {
            id: string
            name: string
            email?: string
        }
        type: string // Document type (Contract, Invoice, etc.)
    },
    onProgress?: (progress: number) => void,
): Promise<Document | null> {
    try {
        const { storage, db } = getFirebaseServices()
        if (!storage || !db) throw new Error("Firebase not initialized")

        // Create a unique filename
        const timestamp = Date.now()
        const uniqueFilename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`

        // Create a storage reference
        const storageRef = ref(storage, `documents/${metadata.projectId}/${uniqueFilename}`)

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
                            name: metadata.name || file.name,
                            description: metadata.description,
                            projectId: metadata.projectId,
                            taskId: metadata.taskId,
                            fileUrl,
                            fileType: file.type,
                            fileSize: file.size,
                            uploadedBy: metadata.uploadedBy,
                            uploadedAt: Timestamp.now(),
                            tags: metadata.tags || [],
                            status: "active",
                            version: 1,
                            viewCount: 0,
                            downloadCount: 0,
                            type: metadata.type, // Add document type
                        }

                        // Add document to Firestore
                        const documentsCollection = collection(db, "documents")
                        const docRef = await addDoc(documentsCollection, docData)

                        // Record the upload activity
                        await addDocumentActivity({
                            documentId: docRef.id,
                            actionType: "upload",
                            actionBy: {
                                id: metadata.uploadedBy.id,
                                name: metadata.uploadedBy.name,
                            },
                            details: "Document uploaded",
                        })

                        // Return the complete document with ID
                        const newDoc = { id: docRef.id, ...docData }
                        resolve(newDoc)
                    } catch (error) {
                        console.error("Error saving document metadata:", error)
                        reject(error)
                    }
                },
            )
        })
    } catch (error) {
        console.error("Error uploading document:", error)
        return null
    }
}

// Update document metadata
export async function updateDocument(id: string, data: Partial<Document>): Promise<boolean> {
    try {
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        const docRef = doc(db, "documents", id)

        // Remove fields that shouldn't be updated directly
        const { id: docId, uploadedAt, uploadedBy, fileUrl, fileSize, fileType, ...updateData } = data

        await updateDoc(docRef, {
            ...updateData,
            lastModified: Timestamp.now(),
        })

        // Record the edit activity if user info is provided
        if (data.uploadedBy) {
            await addDocumentActivity({
                documentId: id,
                actionType: "edit",
                actionBy: {
                    id: data.uploadedBy.id,
                    name: data.uploadedBy.name,
                },
                details: "Document metadata updated",
            })
        }

        return true
    } catch (error) {
        console.error("Error updating document:", error)
        return false
    }
}

// Delete a document
export async function deleteDocument(id: string, userId: string, userName: string): Promise<boolean> {
    try {
        const { db, storage } = getFirebaseServices()
        if (!db || !storage) throw new Error("Firebase not initialized")

        // Get the document first to get the storage path
        const docRef = doc(db, "documents", id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
            throw new Error("Document not found")
        }

        const document = { id: docSnap.id, ...docSnap.data() } as Document

        // Update the document status to deleted instead of actually deleting
        await updateDoc(docRef, {
            status: "deleted",
            lastModified: Timestamp.now(),
        })

        // Record the delete activity
        await addDocumentActivity({
            documentId: id,
            actionType: "delete",
            actionBy: {
                id: userId,
                name: userName,
            },
            details: "Document deleted",
        })

        // Optionally, delete the file from storage
        // Uncomment this if you want to actually delete the file
        /*
        if (document.fileUrl) {
          try {
            // Extract the path from the URL
            const url = new URL(document.fileUrl)
            const path = url.pathname.split('/o/')[1]
            if (path) {
              const decodedPath = decodeURIComponent(path)
              const fileRef = ref(storage, decodedPath)
              await deleteObject(fileRef)
            }
          } catch (error) {
            console.error("Error deleting file from storage:", error)
            // Continue even if storage deletion fails
          }
        }
        */

        return true
    } catch (error) {
        console.error("Error deleting document:", error)
        return false
    }
}

// Get document by ID
export async function getDocumentById(id: string): Promise<Document | null> {
    try {
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        const docRef = doc(db, "documents", id)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Document
        }

        return null
    } catch (error) {
        console.error("Error getting document by ID:", error)
        return null
    }
}

// View a document (increment view count)
export async function viewDocument(id: string, userId: string, userName: string): Promise<string | null> {
    try {
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        const docRef = doc(db, "documents", id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
            throw new Error("Document not found")
        }

        const document = { id: docSnap.id, ...docSnap.data() } as Document

        // Increment view count
        await updateDoc(docRef, {
            viewCount: (document.viewCount || 0) + 1,
            lastModified: Timestamp.now(),
        })

        // Record the view activity
        await addDocumentActivity({
            documentId: id,
            actionType: "view",
            actionBy: {
                id: userId,
                name: userName,
            },
        })

        return document.fileUrl
    } catch (error) {
        console.error("Error viewing document:", error)
        return null
    }
}

// Download a document (increment download count)
export async function downloadDocument(id: string, userId: string, userName: string): Promise<string | null> {
    try {
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        const docRef = doc(db, "documents", id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
            throw new Error("Document not found")
        }

        const document = { id: docSnap.id, ...docSnap.data() } as Document

        // Increment download count
        await updateDoc(docRef, {
            downloadCount: (document.downloadCount || 0) + 1,
            lastModified: Timestamp.now(),
        })

        // Record the download activity
        await addDocumentActivity({
            documentId: id,
            actionType: "download",
            actionBy: {
                id: userId,
                name: userName,
            },
        })

        return document.fileUrl
    } catch (error) {
        console.error("Error downloading document:", error)
        return null
    }
}

// Add a document activity
export async function addDocumentActivity(activity: {
    documentId: string
    actionType: DocumentActivity["actionType"]
    actionBy: {
        id: string
        name: string
    }
    details?: string
}): Promise<boolean> {
    try {
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        const activitiesCollection = collection(db, "documentActivities")

        await addDoc(activitiesCollection, {
            ...activity,
            actionDate: Timestamp.now(),
        })

        return true
    } catch (error) {
        console.error("Error adding document activity:", error)
        return false
    }
}

// Get document statistics
export async function getDocumentStatistics(projectId: string): Promise<DocumentStatistics | null> {
    try {
        const { db } = getFirebaseServices()
        if (!db) throw new Error("Firestore not initialized")

        // Get all documents for the project
        const documents = await getDocuments({ projectId, status: "active" })

        // Calculate total count
        const totalDocuments = documents.length

        if (totalDocuments === 0) {
            return {
                totalDocuments: 0,
                documentsByType: [],
                documentsByTask: [],
                recentActivity: [],
            }
        }

        // Group by type
        const typeCount: Record<string, number> = {}
        documents.forEach((doc) => {
            // Use the document type field if available, otherwise use file type
            const typeName = doc.type || "Other"
            typeCount[typeName] = (typeCount[typeName] || 0) + 1
        })

        // Calculate percentages and create type objects
        const documentsByType = Object.entries(typeCount).map(([name, count]) => {
            const percentage = (count / totalDocuments) * 100

            // Assign a color based on the document type
            const colorMap: Record<string, string> = {
                Contract: "blue",
                Invoice: "green",
                Document: "indigo",
                Notes: "amber",
                Diagram: "purple",
                Documentation: "cyan",
                Design: "pink",
                Spreadsheet: "emerald",
                Presentation: "orange",
                Report: "red",
                Other: "slate",
            }

            return {
                id: name.toLowerCase().replace(/\s+/g, "-"),
                name,
                count,
                percentage,
                color: colorMap[name] || "gray",
            }
        })

        // Group by task
        const taskCount: Record<string, { count: number }> = {}
        documents.forEach((doc) => {
            if (doc.taskId) {
                if (!taskCount[doc.taskId]) {
                    taskCount[doc.taskId] = { count: 0 }
                }
                taskCount[doc.taskId].count += 1
            }
        })

        // Calculate percentages and create task objects
        const documentsByTask = Object.entries(taskCount).map(([taskId, { count }]) => {
            const percentage = (count / totalDocuments) * 100
            const taskName = `Task ${taskId}` // Replace with actual logic to fetch task name if available
            return {
                taskId,
                taskName,
                count,
                percentage,
            }
        })

        // Get recent activities
        const activitiesCollection = collection(db, "documentActivities")

        // Get document IDs for the project
        const documentIds = documents.map((doc) => doc.id)

        // If there are no documents, return empty activities
        if (documentIds.length === 0) {
            return {
                totalDocuments,
                documentsByType,
                documentsByTask,
                recentActivity: [],
            }
        }

        // We can only query 'in' with 10 items at a time, so we'll need to batch
        const batchSize = 10
        let allActivities: DocumentActivity[] = []

        // Process in batches of 10
        for (let i = 0; i < documentIds.length; i += batchSize) {
            const batch = documentIds.slice(i, i + batchSize)

            if (batch.length > 0) {
                const q = query(
                    activitiesCollection,
                    where("documentId", "in", batch),
                    orderBy("actionDate", "desc"),
                    limit(50),
                )

                const activitiesSnapshot = await getDocs(q)
                const batchActivities = activitiesSnapshot.docs.map(
                    (doc) =>
                        ({
                            id: doc.id,
                            ...doc.data(),
                        }) as DocumentActivity,
                )

                allActivities = [...allActivities, ...batchActivities]
            }
        }

        // Sort all activities by date and take the most recent 10
        allActivities.sort((a, b) => {
            const dateA = a.actionDate instanceof Timestamp ? a.actionDate.toMillis() : 0
            const dateB = b.actionDate instanceof Timestamp ? b.actionDate.toMillis() : 0
            return dateB - dateA
        })

        const recentActivity = allActivities.slice(0, 10)

        return {
            totalDocuments,
            documentsByType,
            documentsByTask,
            recentActivity,
        }
    } catch (error) {
        console.error("Error getting document statistics:", error)
        return null
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
