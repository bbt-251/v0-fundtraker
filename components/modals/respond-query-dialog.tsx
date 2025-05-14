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
import type { QueryFormData } from "./add-query-dialog"

interface RespondQueryDialogProps {
  query: QueryFormData
  open: boolean
  onOpenChange: (open: boolean) => void
  onRespond: (
    id: string,
    response: string,
    status: "Open" | "Responded" | "Resolved" | "Escalated",
    dateResolved?: Date,
  ) => void
}

export function RespondQueryDialog({ query, open, onOpenChange, onRespond }: RespondQueryDialogProps) {
  const [response, setResponse] = useState(query.response || "")
  const [status, setStatus] = useState<"Open" | "Responded" | "Resolved" | "Escalated">(query.status)
  const [dateResolved, setDateResolved] = useState<Date | undefined>(query.dateResolved)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onRespond(query.id, response, status, dateResolved)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Respond to Query</DialogTitle>
          <DialogDescription>Provide a response to this query or update its status.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Query ID</Label>
              <p className="text-sm font-medium">{query.id}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date Raised</Label>
              <p className="text-sm">{format(new Date(query.dateRaised), "MMM d, yyyy")}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm border p-2 rounded-md bg-muted/30">{query.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Raised By</Label>
              <p className="text-sm">{query.raisedBy}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Assigned To</Label>
              <p className="text-sm">{query.assignedTo}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response">Response / Action Taken</Label>
            <Textarea
              id="response"
              placeholder="Enter your response or action taken"
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as any)} required>
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

            <div className="space-y-2">
              <Label htmlFor="dateResolved">Date Resolved</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateResolved && "text-muted-foreground",
                    )}
                    disabled={status !== "Resolved"}
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Response</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
