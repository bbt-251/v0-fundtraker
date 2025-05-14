export interface TeamMeeting {
  id: string
  projectId: string
  title: string
  date: string // ISO string format
  startTime: string
  endTime: string
  location: string
  attendees: string
  absentees: string
  keyPoints: string
  decisions: string
  actionItems: string
  blockers: string
  meetingType: MeetingType
  status: MeetingStatus
  createdAt: string
  updatedAt: string
  createdBy: string
}

export type MeetingType = "status" | "planning" | "review" | "design" | "retro" | "other"

export type MeetingStatus = "scheduled" | "completed" | "cancelled"

export interface TeamMeetingFormData {
  title: string
  date: Date
  startTime: string
  endTime: string
  location: string
  attendees: string
  absentees: string
  keyPoints: string
  decisions: string
  actionItems: string
  blockers: string
  meetingType: MeetingType
  status: MeetingStatus
}

export const defaultMeetingFormData: TeamMeetingFormData = {
  title: "",
  date: new Date(),
  startTime: "10:00",
  endTime: "11:00",
  location: "",
  attendees: "",
  absentees: "",
  keyPoints: "",
  decisions: "",
  actionItems: "",
  blockers: "",
  meetingType: "status",
  status: "scheduled",
}
