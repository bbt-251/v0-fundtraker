export type QueryStatus = "Open" | "Responded" | "Resolved" | "Escalated"
export type QueryCategory = "Task" | "Decision" | "Blocker" | "General" | "Process" | string

export interface Query {
  id: string
  docId?: string // Firestore document ID
  dateRaised: Date | string
  raisedById: string
  raisedBy: string
  relatedTo: string
  description: string
  category: QueryCategory
  assignedToId: string
  assignedTo: string
  status: QueryStatus
  response?: string
  responseDate?: Date | string
  dateResolved?: Date | string
  projectId?: string
}

export interface QueryFormData {
  dateRaised: Date
  raisedById: string
  relatedTo: string
  description: string
  category: QueryCategory
  assignedToId: string
  status: QueryStatus
  projectId: string
}
