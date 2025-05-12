"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { getScheduledTransfers, updateScheduledTransfer } from "@/services/project-service"
import type { ScheduledTransfer } from "@/types/project"
import { auth } from "@/lib/firebase/firebase"
import { DatePicker } from "@/components/ui/ant-date-picker"

export function ScheduledTransfersTab() {
  const [transfers, setTransfers] = useState<ScheduledTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [selectedTransfer, setSelectedTransfer] = useState<ScheduledTransfer | null>(null)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchTransfers()
  }, [])

  const fetchTransfers = async () => {
    try {
      setLoading(true)
      const fetchedTransfers = await getScheduledTransfers()
      setTransfers(fetchedTransfers)
      setError(null)
    } catch (err) {
      console.error("Error fetching scheduled transfers:", err)
      setError("Failed to load scheduled transfers")
    } finally {
      setLoading(false)
    }
  }

  const handleProcess = (transfer: ScheduledTransfer) => {
    setSelectedTransfer(transfer)
    setScheduledDate(undefined)
    setNotes("")
    setIsProcessDialogOpen(true)
  }

  const handleProcessConfirm = async () => {
    if (!selectedTransfer || !scheduledDate) return

    try {
      // Create update object without undefined values
      const updateData: Partial<ScheduledTransfer> = {
        status: "Pending",
        scheduledDate: scheduledDate.toISOString(),
      }

      // Only add notes if it's not empty
      if (notes.trim() !== "") {
        updateData.notes = notes
      }

      const updatedTransfer = await updateScheduledTransfer(selectedTransfer.projectId, selectedTransfer.id, updateData)

      setTransfers((prev) => prev.map((t) => (t.id === updatedTransfer.id ? updatedTransfer : t)))

      setIsProcessDialogOpen(false)
    } catch (err) {
      console.error("Error processing transfer:", err)
      setError("Failed to process transfer")
    }
  }

  const handleMarkTransferred = async (transfer: ScheduledTransfer) => {
    try {
      const currentUser = auth.currentUser
      if (!currentUser) {
        setError("You must be logged in to mark a transfer as completed")
        return
      }

      const updatedTransfer = await updateScheduledTransfer(transfer.projectId, transfer.id, {
        status: "Transferred",
        transferredDate: new Date().toISOString(),
        transferredBy: currentUser.uid,
        transferredByName: currentUser.displayName || "Fund Custodian",
      })

      setTransfers((prev) => prev.map((t) => (t.id === updatedTransfer.id ? updatedTransfer : t)))
    } catch (err) {
      console.error("Error marking transfer as completed:", err)
      setError("Failed to mark transfer as completed")
    }
  }

  const getStatusBadge = (status: ScheduledTransfer["status"]) => {
    switch (status) {
      case "To be Transferred":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            To be Transferred
          </Badge>
        )
      case "Pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Pending
          </Badge>
        )
      case "Transferred":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Transferred
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>{error}</p>
        <Button variant="outline" className="mt-2" onClick={fetchTransfers}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Transfers</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <div className="space-y-4 text-center py-8">
            <p className="text-gray-500">No scheduled transfers found</p>
            <p className="text-sm text-gray-400">
              If you have approved fund release requests, they should appear here automatically. Try refreshing the page
              or check if the fund release requests were properly approved.
            </p>
            <Button variant="outline" size="sm" onClick={fetchTransfers} className="mx-auto mt-2">
              Refresh Transfers
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">{transfer.projectName}</TableCell>
                  <TableCell>{transfer.milestoneName}</TableCell>
                  <TableCell>
                    <div>{transfer.recipientName}</div>
                    <div className="text-sm text-gray-500">
                      {transfer.bankName} - {transfer.accountNumber}
                    </div>
                  </TableCell>
                  <TableCell>${transfer.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    {transfer.scheduledDate ? format(new Date(transfer.scheduledDate), "PPP") : "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell>
                    {transfer.status === "To be Transferred" && (
                      <Button size="sm" onClick={() => handleProcess(transfer)}>
                        Process
                      </Button>
                    )}
                    {transfer.status === "Pending" && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkTransferred(transfer)}>
                        Transferred
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Transfer</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <DatePicker
                  date={scheduledDate}
                  onDateChange={(date) => setScheduledDate(date)}
                  className="w-full"
                  placeholder="Select date"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this transfer"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleProcessConfirm} disabled={!scheduledDate}>
                Schedule Transfer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
