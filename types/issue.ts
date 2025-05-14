export interface Issue {
  id: string
  docId?: string
  dateRaised: Date
  reportedBy: string
  relatedTo: string
  description: string
  severity: "Critical" | "High" | "Medium" | "Low"
  impactArea: string
  assignedTo: string
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated"
  resolution?: string
  dateResolved?: Date
  comments?: string
  createdAt: Date
  updatedAt: Date
}

export type IssueFormData = Omit<Issue, "docId" | "createdAt" | "updatedAt">
