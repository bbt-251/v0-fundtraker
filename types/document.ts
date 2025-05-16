import type { Timestamp } from "firebase/firestore"

export interface DocumentTag {
  id: string
  name: string
  color?: string
}

export interface ProjectDocument {
  id: string
  name: string
  fileName: string
  projectId: string
  taskId?: string
  type: string
  size: number
  sizeFormatted: string
  url: string
  uploadedBy: {
    id: string
    name: string
    email: string
  }
  uploadedAt: Timestamp
  description?: string
  tags: string[]
  fileExtension: string
  contentType: string
  isPublic: boolean
  sharedWith?: string[]
  lastViewed?: Timestamp
  downloadCount?: number
  viewCount?: number
  status?: "active" | "archived" | "deleted"
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

export interface DocumentType {
  id: string
  name: string
  count: number
  percentage: number
  color: string
}

export interface DocumentStatistics {
  totalDocuments: number
  documentsByType: DocumentType[]
  documentsByTask: {
    taskId: string
    taskName: string
    count: number
    percentage: number
  }[]
  recentActivity: DocumentActivity[]
}

export interface Document {
  id: string
  name: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: string
  projectId: string
  taskId?: string
  tags?: string[]
  lastModified?: string
  version?: number
  status?: "draft" | "final" | "archived"
}

export interface DocumentFilter {
  projectId?: string
  taskId?: string
  type?: string
  tags?: string[]
  uploadedBy?: string
  dateFrom?: Date
  dateTo?: Date
  searchQuery?: string
  fileType?: string
  status?: string
}
