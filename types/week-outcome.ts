export interface UpcomingDeliverable {
  id: string
  name: string
  dueDate: string
}

export interface WeekOutcome {
  id: string
  projectId: string
  weekOf: string
  completedTasks: string[]
  activityCompletionRate: number
  activitiesCompleted: number
  activitiesPlanned: number
  deliverables: string[]
  upcomingDeliverables: UpcomingDeliverable[]
  createdAt: string
  updatedAt?: string
}

export interface WeekOutcomeFormData {
  projectId: string
  weekOf: string
  completedTasks: string[]
  activitiesCompleted: number
  activitiesPlanned: number
  deliverables: string[]
  upcomingDeliverables: UpcomingDeliverable[]
}
