export interface CommunicationMedium {
  id: string
  medium: string
}

export type ProjectApprovalStatus = "pending" | "approved" | "rejected"

export type ProjectStatus = "draft" | "pending" | "approved" | "rejected"

export interface Project {
  id: string
  name: string
  description: string
  ownerId: string
  ownerName?: string
  category: string
  location: string
  budget: number
  timeline: string
  objectives: string[]
  beneficiaries: string
  status: ProjectStatus
  announced: boolean
  rejectionReason?: string
  createdAt: any
  updatedAt?: any
  imageUrl?: string
  documents?: Record<string, any>[]
  isUrgent?: boolean
  isSaved?: boolean
  donations?: number
  fundingGoal?: number
  fundingProgress?: number
  userId: string
  scope: string
  documents: ProjectDocument[]
  humanResources: HumanResource[]
  materialResources: MaterialResource[]
  fundAccounts: FundAccount[]
  activities: ProjectActivity[]
  tasks: ProjectTask[]
  deliverables: ProjectDeliverable[]
  milestones: ProjectMilestone[]
  decisionGates?: DecisionGate[]
  risks?: ProjectRisk[]
  communicationPlan?: CommunicationPlan
  socialMediaAccounts?: SocialMediaAccount[]
  communicationMediums?: CommunicationMedium[]
  cost?: number
  isAnnouncedToDonors?: boolean
  isInExecution?: boolean
  approvalStatus?: ProjectApprovalStatus
  announcementDate?: string
  milestoneBudgets?: MilestoneBudget[]
  fundReleaseRequests?: FundReleaseRequest[]
  projectManagerId?: string
}

export interface ProjectFormData {
  name: string
  description: string
  scope: string
  objectives: string
  location: string
  category: string
}

export interface ProjectDocument {
  id: string
  name: string
  type: "business" | "tax" | "additional"
  url: string
  uploadedAt: string
}

export interface HumanResource {
  id: string
  name: string
  role: string
  email: string
  phone?: string
  costPerDay: number
  quantity: number
}

export interface MaterialResource {
  id: string
  name: string
  type: string
  description: string
  costType: "one-time" | "recurring"
  costAmount: number
  amortizationPeriod: number
}

export interface FundAccount {
  id: string
  accountName: string
  accountType: "Domestic Account" | "Foreign Account"
  bankName: string
  accountOwnerName: string
  status?: "Pending" | "Approved" | "Rejected"
  createdAt: string
}

export interface ProjectActivity {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  status: "Not Started" | "In Progress" | "Completed" | "Delayed"
  createdAt: string
}

export interface ProjectTask {
  id: string
  activityId: string
  name: string
  description: string
  startDate: string
  endDate: string
  duration: number
  resources: TaskResourceAssignment[]
  createdAt: string
}

export interface TaskResourceAssignment {
  id: string
  resourceId: string
  resourceType: "human" | "material"
  quantity: number
  startDate: string
  endDate: string
  duration: number
  dailyCost: number
  totalCost: number
}

export interface ProjectDeliverable {
  id: string
  name: string
  description: string
  deadline: string
  status: "Not Started" | "In Progress" | "Completed" | "Delayed"
  successCriteria?: SuccessCriteria[]
  createdAt: string
}

export interface SuccessCriteria {
  id: string
  description: string
}

export interface ProjectMilestone {
  id: string
  name: string
  description: string
  date: string
  status: "Not Started" | "In Progress" | "Completed" | "Delayed"
  associatedDeliverables?: string[]
  createdAt: string
  budget?: number
  percentOfTotal?: number
}

export interface DecisionGate {
  id: string
  name: string
  videoConferenceLink: string
  dateTime: string
  objective: string
  participants: Participant[]
  status: "Scheduled" | "Completed" | "Cancelled"
  createdAt: string
}

export interface Participant {
  id: string
  name: string
}

export interface ProjectRisk {
  id: string
  name: string
  description: string
  impact: number // 1-5 scale
  probability: number // 1-5 scale
  riskScore: number // impact * probability
  status: "Active" | "Mitigated" | "Closed" | "Accepted"
  associatedActivities?: string[] // Activity IDs
  mitigationActions?: MitigationAction[]
  createdAt: string
  updatedAt: string
}

export interface MitigationAction {
  id: string
  description: string
}

export interface CommunicationPlan {
  stakeholderStrategy: string
  meetingSchedule: string
  reportingFrequency: string
  feedbackMechanisms: string
  emergencyContacts: string
}

export interface SocialMediaAccount {
  id: string
  platform: string
  username: string
  url?: string
}

export interface MilestoneBudget {
  id: string
  milestoneId: string
  budgetItem: string
  cost: number
}

export interface FundReleaseRequest {
  id: string
  projectId: string
  milestoneId: string
  amount: number
  description: string
  status: "Pending" | "Approved" | "Rejected"
  requestedBy: string
  requestedByName: string
  requestDate: string
  approvedBy?: string
  approvedByName?: string
  approvalDate?: string
  rejectionReason?: string
}
