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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TeamMember } from "@/types/team-member"
import { useAuth } from "@/contexts/auth-context"

export type QueryStatus = "Open" | "Responded" | "Resolved" | "Escalated"
export type QueryCategory = "Task" | "Decision" | "Blocker" | "General" | "Process" | string

export interface QueryFormData {
  dateRaised: Date
  raisedById: string
  relatedTo: string
  description: string
  category: QueryCategory
  assignedToId: string
  status: QueryStatus
  projectId: string
}

interface AddQueryDialogProps {
  onAddQuery: (query: any) => void
  teamMembers: TeamMember[]
  projectId?: string
}

export function AddQueryDialog({ onAddQuery, teamMembers, projectId }: AddQueryDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [queryId, setQueryId] = useState("")
  const { user } = useAuth()

  const [dateRaised, setDateRaised] = useState<Date>(new Date())
  const [raisedById, setRaisedById] = useState("")
  const [relatedTo, setRelatedTo] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState<QueryCategory>("Task")
  const [assignedToId, setAssignedToId] = useState("")
  const [status, setStatus] = useState<QueryStatus>("Open")
  const [newCategory, setNewCategory] = useState("")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [existingCategories, setExistingCategories] = useState<QueryCategory[]>([
    "Task",
    "Decision",
    "Blocker",
    "General",
    "Process",
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  }

  const handleAddCategory = () => {
    if (newCategory.trim() !== "") {
      setExistingCategories([...existingCategories, newCategory])
      setCategory(newCategory)
      setNewCategory("")
      setShowAddCategory(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Query
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Query</DialogTitle>
          <DialogDescription>Create a new query or information request.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="queryId">Query ID</Label>
              <Input id="queryId" value={queryId} disabled placeholder="Auto-generated" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateRaised">Date Raised</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRaised ? format(dateRaised, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateRaised} onSelect={setDateRaised} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="raisedBy">Raised By</Label>
              <Select value={raisedById} onValueChange={(value) => setRaisedById(value)}>
                <SelectTrigger id="raisedBy">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {`${member.firstName} ${member.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="relatedTo">Related To</Label>
              <Input
                id="relatedTo"
                placeholder="Task, activity, or topic"
                value={relatedTo}
                onChange={(e) => setRelatedTo(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Query Description</Label>
            <Textarea
              id="description"
              placeholder="Enter your question or concern"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              {showAddCategory ? (
                <div className="flex gap-2">
                  <Input
                    id="newCategory"
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                  <Button type="button" onClick={handleAddCategory} size="sm">
                    Add
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  <Select value={category} onValueChange={(value) => setCategory(value as QueryCategory)}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="self-start h-auto p-0 text-xs"
                    onClick={() => setShowAddCategory(true)}
                  >
                    Add new category
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select value={assignedToId} onValueChange={(value) => setAssignedToId(value)}>
                <SelectTrigger id="assignedTo">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {`${member.firstName} ${member.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as QueryStatus)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Responded">Responded</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Query"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
