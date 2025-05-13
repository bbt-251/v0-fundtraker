export interface TeamMember {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  employmentType: "full-time" | "part-time" | "contractor" | "intern"
  workingDays: string[]
  projectId?: string
  ownerId: string
  createdAt: string
  updatedAt?: string
  avatar?: string
}

export interface TeamMemberFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  employmentType: "full-time" | "part-time" | "contractor" | "intern"
  workingDays: string[]
  projectId?: string
}
