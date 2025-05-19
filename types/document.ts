import type { Timestamp } from "firebase/firestore"

export interface DocumentTag {
  id: string
  name: string
  color?: string
}

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
  type?: string // Document type (Contract, Invoice, etc.)
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
