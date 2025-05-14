export type BlockerImpact = "Low" | "Medium" | "High"

export type BlockerStatus = "Active" | "Resolved"

export interface Blocker {
  id: string
  title: string
  description: string
  impact: BlockerImpact
  impactDescription: string
  status: BlockerStatus
  reportedBy: string
  reportedById: string
  assignedTo: string
  assignedToId: string
  reportedDate: string | Date
  expectedResolutionDate: string | Date
  resolvedDate?: string | Date
  resolutionNotes?: string
  resolutionPlan: string
  relatedTasks: string
  notes?: string
  projectId?: string
  previouslyResolved?: boolean
}

export interface BlockerFormData {
  title: string
  description: string
  impact: BlockerImpact
  impactDescription: string
  reportedById: string
  reportedBy: string
  assignedToId: string
  assignedTo: string
  reportedDate: Date
  expectedResolutionDate: Date
  resolutionPlan: string
  relatedTasks: string
  notes?: string
  projectId?: string
}
