export interface Donation {
  id: string
  projectId: string
  userId?: string
  donorName?: string
  donorEmail?: string
  amount: number
  message?: string
  isAnonymous: boolean
  timestamp: any
  status: "pending" | "completed" | "failed"
}
