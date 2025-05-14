"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { IssueFormData } from "@/types/issue"

interface UpdateIssueDialogProps {
  issue: IssueFormData
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (
    id: string,
    status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated",
    resolution: string,
    assignedTo: string,
    dateResolved?: Date,
    comments?: string,
  ) => void
  teamMembers: { id: number; name: string }[]
}

export function UpdateIssueDialog({ issue, open, onOpenChange, onUpdate, teamMembers }: UpdateIssueDialogProps) {
  const [status, setStatus] = useState<"Open" | "In Progress" | "Resolved" | "Closed" | "Escalated">(issue.status)
  const [resolution, setResolution] = useState(issue.resolution || "")
  const [dateResolved, setDateResolved] = useState<Date | undefined>(issue.dateResolved)
  const [comments, setComments] = useState(issue.comments || "")
  const [assignedTo, setAssignedTo] = useState(issue.assignedTo)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(issue.id, status, resolution, assignedTo, dateResolved, comments)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Issue</DialogTitle>
          <DialogDescription>Update the status and resolution of this issue.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Issue ID</Label>
              <p className="text-sm font-medium">{issue.id}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date Raised</Label>
              <p className="text-sm">{format(new Date(issue.dateRaised), "MMM d, yyyy")}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm border p-2 rounded-md bg-muted/30">{issue.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Reported By</Label>
              <p className="text-sm">{issue.reportedBy}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Severity</Label>
              <p className="text-sm">{issue.severity}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.name}>
                      {member.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolution">Resolution / Action Taken</Label>
            <Textarea
              id="resolution"
              placeholder="Describe how the issue was resolved"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              required={status === "Resolved" || status === "Closed"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateResolved">Date Resolved</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !dateResolved && "text-muted-foreground")}
                  disabled={status !== "Resolved" && status !== "Closed"}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateResolved ? format(dateResolved, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateResolved}
                  onSelect={(date) => date && setDateResolved(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comments">Comments / Notes</Label>
            <Textarea
              id="comments"
              placeholder="Additional context, next steps, etc."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Update Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
