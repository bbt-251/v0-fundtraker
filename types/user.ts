export type UserRole = "Project Owner" | "Fund Custodian" | "Platform Governor" | "Donor" | "Investor"

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected"

export interface Address {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface VerificationDocument {
  type: string
  fileURL: string
  uploadedAt: string
  status: VerificationStatus
}

export interface UserProfile {
  uid: string
  email: string | null
  role: UserRole
  verified: boolean
  verificationStatus: VerificationStatus
  createdAt: string
  displayName?: string
  photoURL?: string

  // Personal information
  firstName?: string
  lastName?: string
  phoneNumber?: string
  dateOfBirth?: string

  // Address information
  address?: Address

  // Verification documents
  verificationDocuments?: VerificationDocument[]

  // Additional fields
  completedProfile: boolean
  submittedVerification: boolean

  // Saved projects
  savedProjects?: string[]
}
