import type { Timestamp } from "firebase/firestore"

export interface Document {
  id: string
  name: string
  description?: string
  projectId: string
  taskId?: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy: {
    id: string
    name: string
    email?: string
  }
  uploadedAt: Timestamp | string
  lastModified?: Timestamp | string
  tags?: string[]
  status: "active" | "archived" | "deleted" | "draft"
  version: number
  viewCount?: number
  downloadCount?: number
}

export interface DocumentActivity {
  id: string
  documentId: string
  actionType: "upload" | "view" | "download" | "edit" | "delete" | "share"
  actionBy: {
    id: string
    name: string
  }
  actionDate: Timestamp
  details?: string
}

export interface DocumentFilter {
  projectId?: string
  taskId?: string
  fileType?: string
  status?: string
  searchQuery?: string
  tags?: string[]
}

export interface DocumentStatistics {
  totalDocuments: number
  documentsByType: {
    id: string
    name: string
    count: number
    percentage: number
    color: string
  }[]
  documentsByTask: {
    taskId: string
    taskName: string
    count: number
    percentage: number
  }[]
  recentActivity: DocumentActivity[]
}
