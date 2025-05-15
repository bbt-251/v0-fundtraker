export interface ChangeRequest {
  id: string
  projectId: string
  title: string
  description: string
  changeType: string
  reason: string
  affectedDeliverables: string[]
  impact: string
  requestDate: string
  status: string
  decision: string
  createdAt: string
  updatedAt?: string
}

export type ChangeRequestStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Rejected"

export type ChangeRequestType = "Scope" | "Schedule" | "Resources" | "Technology" | "Budget"
