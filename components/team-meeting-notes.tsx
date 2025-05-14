"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Check, X, ExternalLink } from "lucide-react"
import { AddTeamMeetingDialog } from "@/components/modals/add-team-meeting-dialog"
import {
  createTeamMeeting,
  getTeamMeetings,
  updateMeetingStatus,
  deleteTeamMeeting,
} from "@/services/team-meeting-service"
import type { TeamMeeting, TeamMeetingFormData } from "@/types/team-meeting"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { LoadingAnimation } from "@/components/loading-animation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

interface TeamMeetingNotesProps {
  projectId: string
}

export function TeamMeetingNotes({ projectId }: TeamMeetingNotesProps) {
  const [meetings, setMeetings] = useState<TeamMeeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [meetingToDelete, setMeetingToDelete] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (!projectId) return

    const fetchMeetings = async () => {
      try {
        setLoading(true)
        setError(null)
        const fetchedMeetings = await getTeamMeetings(projectId)
        setMeetings(fetchedMeetings)
      } catch (err) {
        console.error("Error fetching team meetings:", err)
        setError("Failed to load team meetings. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchMeetings()
  }, [projectId])

  const handleAddMeeting = async (projectId: string, meetingData: TeamMeetingFormData) => {
    if (!user?.uid) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add a meeting.",
        variant: "destructive",
      })
      return
    }

    try {
      const meetingId = await createTeamMeeting(projectId, meetingData, user.uid)

      // Refresh the meetings list
      const updatedMeetings = await getTeamMeetings(projectId)
      setMeetings(updatedMeetings)

      return meetingId
    } catch (error) {
      console.error("Error adding meeting:", error)
      throw error
    }
  }

  const handleStatusChange = async (meetingId: string, newStatus: "scheduled" | "completed" | "cancelled") => {
    try {
      await updateMeetingStatus(meetingId, newStatus)

      // Update the local state
      setMeetings((prevMeetings) =>
        prevMeetings.map((meeting) => (meeting.id === meetingId ? { ...meeting, status: newStatus } : meeting)),
      )

      toast({
        title: "Status updated",
        description: `Meeting status changed to ${newStatus}.`,
      })
    } catch (error) {
      console.error("Error updating meeting status:", error)
      toast({
        title: "Error",
        description: "Failed to update meeting status.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMeeting = async () => {
    if (!meetingToDelete) return

    try {
      await deleteTeamMeeting(meetingToDelete)

      // Update the local state
      setMeetings((prevMeetings) => prevMeetings.filter((meeting) => meeting.id !== meetingToDelete))

      toast({
        title: "Meeting deleted",
        description: "The team meeting has been successfully deleted.",
      })
    } catch (error) {
      console.error("Error deleting meeting:", error)
      toast({
        title: "Error",
        description: "Failed to delete the team meeting.",
        variant: "destructive",
      })
    } finally {
      setMeetingToDelete(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">Scheduled</Badge>
    }
  }

  const getMeetingTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      status: "Status Update",
      planning: "Planning Session",
      review: "Review Meeting",
      design: "Design Review",
      retro: "Retrospective",
      other: "Other",
    }
    return types[type] || type
  }

  const renderMeetingItem = (meeting: TeamMeeting) => {
    const formattedDate = format(parseISO(meeting.date), "MMM d, yyyy")
    const isUrl = meeting.location.startsWith("http://") || meeting.location.startsWith("https://")

    return (
      <div key={meeting.id} className="p-4 border rounded-lg mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium">{meeting.title}</h3>
            <p className="text-sm text-muted-foreground">
              {formattedDate} | {meeting.startTime} - {meeting.endTime} | {getMeetingTypeLabel(meeting.meetingType)}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(meeting.status)}
            <div className="flex space-x-1">
              {meeting.status === "scheduled" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(meeting.id, "completed")}
                  title="Mark as completed"
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
              )}
              {meeting.status === "scheduled" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusChange(meeting.id, "cancelled")}
                  title="Mark as cancelled"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              )}
              <AlertDialog
                open={meetingToDelete === meeting.id}
                onOpenChange={(open) => !open && setMeetingToDelete(null)}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setMeetingToDelete(meeting.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this meeting? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteMeeting}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium">Location/Link</h4>
              <p className="text-sm text-muted-foreground">
                {isUrl ? (
                  <a
                    href={meeting.location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    {meeting.location.length > 40 ? `${meeting.location.substring(0, 40)}...` : meeting.location}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  meeting.location
                )}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Attendees</h4>
              <p className="text-sm text-muted-foreground">{meeting.attendees}</p>
            </div>
          </div>

          {meeting.absentees && (
            <div>
              <h4 className="text-sm font-medium">Absentees</h4>
              <p className="text-sm text-muted-foreground">{meeting.absentees}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium">Key Discussion Points</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {meeting.keyPoints.split("\n").map((point, index) => (
                <div key={index} className="flex items-start">
                  {point.trim() && (
                    <>
                      <span className="mr-2">•</span>
                      <span>{point}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium">Decisions Made</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {meeting.decisions.split("\n").map((decision, index) => (
                <div key={index} className="flex items-start">
                  {decision.trim() && (
                    <>
                      <span className="mr-2">•</span>
                      <span>{decision}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium">Action Items</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {meeting.actionItems.split("\n").map((item, index) => (
                <div key={index} className="flex items-start">
                  {item.trim() && (
                    <>
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {meeting.blockers && (
            <div>
              <h4 className="text-sm font-medium">Blockers/Issues Raised</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {meeting.blockers.split("\n").map((blocker, index) => (
                  <div key={index} className="flex items-start">
                    {blocker.trim() && (
                      <>
                        <span className="mr-2">•</span>
                        <span>{blocker}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Team Meeting Notes</CardTitle>
            <CardDescription>Document discussions and action items from team meetings</CardDescription>
          </div>
          <AddTeamMeetingDialog
            projectId={projectId}
            onAddMeeting={handleAddMeeting}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Meeting
              </Button>
            }
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <LoadingAnimation />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setLoading(true)
                getTeamMeetings(projectId)
                  .then((meetings) => {
                    setMeetings(meetings)
                    setError(null)
                  })
                  .catch((err) => {
                    console.error("Error fetching team meetings:", err)
                    setError("Failed to load team meetings. Please try again.")
                  })
                  .finally(() => setLoading(false))
              }}
            >
              Try Again
            </Button>
          </div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-muted-foreground mb-4">No team meetings recorded yet</p>
            <AddTeamMeetingDialog
              projectId={projectId}
              onAddMeeting={handleAddMeeting}
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Meeting
                </Button>
              }
            />
          </div>
        ) : (
          <div>{meetings.map(renderMeetingItem)}</div>
        )}
      </CardContent>
    </Card>
  )
}
