"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ResolveBlockerModalProps {
  isOpen: boolean
  onClose: () => void
  blockerId: string | null
  onResolve: (blockerId: string, notes: string) => Promise<void>
}

export function ResolveBlockerModal({ isOpen, onClose, blockerId, onResolve }: ResolveBlockerModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleResolve = async () => {
    if (!blockerId) return

    try {
      setIsSubmitting(true)
      await onResolve(blockerId, resolutionNotes)
      handleClose()
    } catch (error) {
      console.error("Error resolving blocker:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setResolutionNotes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resolve Blocker</DialogTitle>
          <DialogDescription>
            This blocker will be marked as resolved and moved to the Resolved Blockers tab.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="resolutionNotes">Notes</Label>
            <Textarea
              id="resolutionNotes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Add notes about how this blocker was resolved..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleResolve} disabled={isSubmitting}>
            {isSubmitting ? "Resolving..." : "Resolve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
