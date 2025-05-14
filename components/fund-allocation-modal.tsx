"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface FundAllocationModalProps {
  donationId: string
  projectId: string
  amount: number
}

export function FundAllocationModal({ donationId, projectId, amount }: FundAllocationModalProps) {
  const [open, setOpen] = useState(false)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="View fund allocation">
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fund Allocation Details</DialogTitle>
            <DialogDescription>
              How your donation of {formatCurrency(amount)} is being allocated in this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Placeholder content - will be updated with actual fund allocation details */}
            <div className="rounded-lg border p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                This is a placeholder for fund allocation details. The actual content will be implemented based on
                additional requirements.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Administrative</span>
                  <span className="text-sm">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Direct Project Costs</span>
                  <span className="text-sm">75%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Operational</span>
                  <span className="text-sm">15%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
