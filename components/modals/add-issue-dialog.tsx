"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TeamMember } from "@/types/team-member"

export interface IssueFormData {
  id: string
  dateRaised: Date
  reportedBy: string
  relatedTo: string
  description: string
  severity: "Critical" | "High" | "Medium" | "Low"
  impactArea: string
  assignedTo: string
  status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated"
  resolution?: string
  dateResolved?: Date
  comments?: string
}

interface AddIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddIssue: (issueData: IssueFormData) => void
  teamMembers: TeamMember[]
  impactAreas: string[]
  onAddImpactArea: (area: string) => void
}

export function AddIssueDialog({
  open,
  onOpenChange,
  onAddIssue,
  teamMembers,
  impactAreas,
  onAddImpactArea,
}: AddIssueDialogProps) {
  const [issueId, setIssueId] = useState("")
  const [dateRaised, setDateRaised] = useState<Date>(new Date())
  const [reportedBy, setReportedBy] = useState("")
  const [relatedTo, setRelatedTo] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<"Critical" | "High" | "Medium" | "Low">("Medium")
  const [impactArea, setImpactArea] = useState("")
  const [newImpactArea, setNewImpactArea] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [status, setStatus] = useState<"Open" | "In Progress" | "Resolved" | "Closed" | "Escalated">("Open")
  const [comments, setComments] = useState("")
  const [showAddImpactArea, setShowAddImpactArea] = useState(false)

console.log("Team Members: ", teamMembers, teamMembers[0], teamMembers[0].firstName, teamMembers[0].lastName)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Generate ID when opening the dialog if it's empty
      if (!issueId) {
        setIssueId(generateIssueId())
      }
    }
  }, [open, issueId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const formData: IssueFormData = {
      id: issueId,
      dateRaised,
      reportedBy,
      relatedTo,
      description,
      severity,
      impactArea,
      assignedTo,
      status,
      comments: comments || undefined,
    }

    onAddIssue(formData)
    resetForm()
    onOpenChange(false)
  }

  const resetForm = () => {
    setIssueId("")
    setDateRaised(new Date())
    setReportedBy("")
    setRelatedTo("")
    setDescription("")
    setSeverity("Medium")
    setImpactArea("")
    setNewImpactArea("")
    setAssignedTo("")
    setStatus("Open")
    setComments("")
    setShowAddImpactArea(false)
  }

  const handleAddImpactArea = () => {
    if (newImpactArea.trim()) {
      onAddImpactArea(newImpactArea.trim())
      setImpactArea(newImpactArea.trim())
      setNewImpactArea("")
      setShowAddImpactArea(false)
    }
  }

  // Generate a new issue ID based on the current year
  const generateIssueId = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    return `IS-${year}-${randomNum}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Issue</DialogTitle>
          <DialogDescription>Create a new issue to track and resolve.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueId">Issue ID</Label>
              <div className="flex gap-2">
                <Input
                  id="issueId"
                  placeholder="IS-2025-001"
                  value={issueId}
                  onChange={(e) => setIssueId(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                  onClick={() => setIssueId(generateIssueId())}
                >
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRaised">Date Raised</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn("w-full justify-start text-left font-normal", !dateRaised && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRaised ? format(dateRaised, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRaised}
                    onSelect={(date) => date && setDateRaised(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportedBy">Reported By</Label>
              <Select value={reportedBy} onValueChange={setReportedBy} required>
                <SelectTrigger id="reportedBy">
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
              <Label htmlFor="relatedTo">Related To</Label>
              <Input
                id="relatedTo"
                placeholder="Task, module, or process"
                value={relatedTo}
                onChange={(e) => setRelatedTo(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Issue Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={(value) => setSeverity(value as any)} required>
                <SelectTrigger id="severity">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impactArea">Impact Area</Label>
              {showAddImpactArea ? (
                <div className="flex gap-2">
                  <Input
                    id="newImpactArea"
                    placeholder="New impact area"
                    value={newImpactArea}
                    onChange={(e) => setNewImpactArea(e.target.value)}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={handleAddImpactArea}
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800"
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Select value={impactArea} onValueChange={setImpactArea} required>
                    <SelectTrigger id="impactArea">
                      <SelectValue placeholder="Select impact area" />
                    </SelectTrigger>
                    <SelectContent>
                      {impactAreas.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="self-start h-auto p-0 text-xs"
                    onClick={() => setShowAddImpactArea(true)}
                  >
                    Add new impact area
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo} required>
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
              <Select value={status} onValueChange={(value) => setStatus(value as any)} required>
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
            <Button type="submit">Add Issue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
