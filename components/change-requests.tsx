"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getChangeRequestsByProject,
  createChangeRequest,
  updateChangeRequest,
  generateChangeRequestId,
} from "@/services/change-request-service"
import type { ChangeRequest, ChangeRequestStatus, ChangeRequestType } from "@/types/change-request"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { DatePicker } from "@/components/ui/ant-date-picker"
import { ChevronDown, Plus } from "lucide-react"
import { message } from "antd"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingAnimation } from "@/components/loading-animation"

interface ChangeRequestsProps {
  projectId: string
}

export function ChangeRequests({ projectId }: ChangeRequestsProps) {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [newChangeRequestDialogOpen, setNewChangeRequestDialogOpen] = useState(false)
  const [editChangeRequestDialogOpen, setEditChangeRequestDialogOpen] = useState(false)
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null)
  const [requestDate, setRequestDate] = useState<Date | null>(new Date())

  // Form state for new change request
  const [title, setTitle] = useState("")
  const [changeRequestId, setChangeRequestId] = useState("")
  const [description, setDescription] = useState("")
  const [changeType, setChangeType] = useState<ChangeRequestType>("Scope")
  const [reason, setReason] = useState("")
  const [affectedDeliverables, setAffectedDeliverables] = useState("")
  const [impact, setImpact] = useState("")
  const [status, setStatus] = useState<ChangeRequestStatus>("Draft")
  const [decision, setDecision] = useState("")

  useEffect(() => {
    fetchChangeRequests()
  }, [projectId])

  const fetchChangeRequests = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const fetchedChangeRequests = await getChangeRequestsByProject(projectId)
      setChangeRequests(fetchedChangeRequests)
    } catch (error) {
      console.error("Error fetching change requests:", error)
      message.error("Failed to load change requests")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateId = () => {
    const existingIds = changeRequests.map((cr) => cr.id)
    const newId = generateChangeRequestId(existingIds)
    setChangeRequestId(newId)
  }

  const resetForm = () => {
    setTitle("")
    setChangeRequestId("")
    setDescription("")
    setChangeType("Scope")
    setReason("")
    setAffectedDeliverables("")
    setImpact("")
    setRequestDate(new Date())
    setStatus("Draft")
    setDecision("")
  }

  const handleOpenNewDialog = () => {
    resetForm()
    handleGenerateId()
    setNewChangeRequestDialogOpen(true)
  }

  const handleCreateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !changeRequestId || !description || !changeType || !reason) {
      message.error("Please fill in all required fields")
      return
    }

    try {
      const newChangeRequest: Omit<ChangeRequest, "id" | "createdAt"> = {
        projectId,
        title,
        description,
        changeType,
        reason,
        affectedDeliverables: affectedDeliverables.split("\n").filter((item) => item.trim() !== ""),
        impact,
        requestDate: requestDate ? requestDate.toISOString() : new Date().toISOString(),
        status,
        decision,
      }

      await createChangeRequest(newChangeRequest)
      message.success("Change request created successfully")
      setNewChangeRequestDialogOpen(false)
      fetchChangeRequests()
    } catch (error) {
      console.error("Error creating change request:", error)
      message.error("Failed to create change request")
    }
  }

  const handleOpenEditDialog = (changeRequest: ChangeRequest) => {
    setSelectedChangeRequest(changeRequest)
    setTitle(changeRequest.title)
    setChangeRequestId(changeRequest.id)
    setDescription(changeRequest.description)
    setChangeType(changeRequest.changeType as ChangeRequestType)
    setReason(changeRequest.reason)
    setAffectedDeliverables(changeRequest.affectedDeliverables.join("\n"))
    setImpact(changeRequest.impact)
    setRequestDate(changeRequest.requestDate ? new Date(changeRequest.requestDate) : new Date())
    setStatus(changeRequest.status as ChangeRequestStatus)
    setDecision(changeRequest.decision)
    setEditChangeRequestDialogOpen(true)
  }

  const handleUpdateChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedChangeRequest) return

    try {
      const updates: Partial<ChangeRequest> = {
        title,
        description,
        changeType,
        reason,
        affectedDeliverables: affectedDeliverables.split("\n").filter((item) => item.trim() !== ""),
        impact,
        status,
        decision,
      }

      await updateChangeRequest(selectedChangeRequest.id, updates)
      message.success("Change request updated successfully")
      setEditChangeRequestDialogOpen(false)
      fetchChangeRequests()
    } catch (error) {
      console.error("Error updating change request:", error)
      message.error("Failed to update change request")
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "Rejected":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Change Request Management</h2>
          <p className="text-sm text-muted-foreground">Track and manage project change requests</p>
        </div>
        <Button size="sm" onClick={handleOpenNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Change Request
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingAnimation />
        </div>
      ) : changeRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground mb-4">No change requests found for this project.</p>
            <Button size="sm" onClick={handleOpenNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Change Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {changeRequests.map((changeRequest) => (
            <Card key={changeRequest.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{changeRequest.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {changeRequest.id} | Requested: {format(new Date(changeRequest.requestDate), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeClass(changeRequest.status)}>{changeRequest.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => handleOpenEditDialog(changeRequest)}>
                      Edit
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-sm">{changeRequest.description}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Change Type</h4>
                    <div className="flex items-center border rounded-md px-3 py-2 text-sm">
                      <span>{changeRequest.changeType}</span>
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Reason for Change</h4>
                    <p className="text-sm border rounded-md p-3">{changeRequest.reason}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Affected Deliverables</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {changeRequest.affectedDeliverables.map((deliverable, index) => (
                        <li key={index}>{deliverable}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Impact Assessment</h4>
                    <p className="text-sm border rounded-md p-3">{changeRequest.impact}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-1">Decision</h4>
                    <p className="text-sm">{changeRequest.decision}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Change Request Dialog */}
      <Dialog open={newChangeRequestDialogOpen} onOpenChange={setNewChangeRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Change Request</DialogTitle>
            <DialogDescription>
              Create a new change request to track modifications to project scope, schedule, or resources.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateChangeRequest}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="crTitle">Title</Label>
                  <Input
                    id="crTitle"
                    placeholder="Additional User Role"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="crId">Change Request ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="crId"
                      placeholder="CR-001"
                      className="flex-1"
                      value={changeRequestId}
                      onChange={(e) => setChangeRequestId(e.target.value)}
                      required
                    />
                    <Button type="button" variant="outline" className="shrink-0" onClick={handleGenerateId}>
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crDescription">Description</Label>
                <Textarea
                  id="crDescription"
                  placeholder="Brief description of the requested change"
                  className="min-h-[60px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crChangeType">Change Type</Label>
                <Select value={changeType} onValueChange={(value) => setChangeType(value as ChangeRequestType)}>
                  <SelectTrigger id="crChangeType">
                    <SelectValue placeholder="Select change type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scope">Scope</SelectItem>
                    <SelectItem value="Schedule">Schedule</SelectItem>
                    <SelectItem value="Resources">Resources</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Budget">Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crReason">Reason for Change</Label>
                <Textarea
                  id="crReason"
                  placeholder="Explain why this change is necessary"
                  className="min-h-[80px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crAffectedDeliverables">Affected Deliverables</Label>
                <Textarea
                  id="crAffectedDeliverables"
                  placeholder="List all deliverables affected by this change (one per line)"
                  className="min-h-[80px]"
                  value={affectedDeliverables}
                  onChange={(e) => setAffectedDeliverables(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crImpact">Impact Assessment</Label>
                <Textarea
                  id="crImpact"
                  placeholder="Describe the impact on risk, tasks, resources, etc."
                  className="min-h-[80px]"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="crRequestDate">Request Date</Label>
                  <DatePicker
                    value={requestDate}
                    onChange={(date) => setRequestDate(date)}
                    format="YYYY-MM-DD"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="crStatus">Status</Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as ChangeRequestStatus)}>
                    <SelectTrigger id="crStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Submitted">Submitted</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crDecision">Decision/Comments</Label>
                <Textarea
                  id="crDecision"
                  placeholder="Decision details or additional comments"
                  className="min-h-[60px]"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Submit Change Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Change Request Dialog */}
      <Dialog open={editChangeRequestDialogOpen} onOpenChange={setEditChangeRequestDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Change Request</DialogTitle>
            <DialogDescription>Update the details of this change request.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateChangeRequest}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="crTitleEdit">Title</Label>
                  <Input id="crTitleEdit" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="crIdEdit">Change Request ID</Label>
                  <Input id="crIdEdit" value={changeRequestId} disabled />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crDescriptionEdit">Description</Label>
                <Textarea
                  id="crDescriptionEdit"
                  className="min-h-[60px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crChangeTypeEdit">Change Type</Label>
                <Select value={changeType} onValueChange={(value) => setChangeType(value as ChangeRequestType)}>
                  <SelectTrigger id="crChangeTypeEdit">
                    <SelectValue placeholder="Select change type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scope">Scope</SelectItem>
                    <SelectItem value="Schedule">Schedule</SelectItem>
                    <SelectItem value="Resources">Resources</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Budget">Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crReasonEdit">Reason for Change</Label>
                <Textarea
                  id="crReasonEdit"
                  className="min-h-[80px]"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crAffectedDeliverablesEdit">Affected Deliverables</Label>
                <Textarea
                  id="crAffectedDeliverablesEdit"
                  className="min-h-[80px]"
                  value={affectedDeliverables}
                  onChange={(e) => setAffectedDeliverables(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crImpactEdit">Impact Assessment</Label>
                <Textarea
                  id="crImpactEdit"
                  className="min-h-[80px]"
                  value={impact}
                  onChange={(e) => setImpact(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crStatusEdit">Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as ChangeRequestStatus)}>
                  <SelectTrigger id="crStatusEdit">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Submitted">Submitted</SelectItem>
                    <SelectItem value="Under Review">Under Review</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="crDecisionEdit">Decision/Comments</Label>
                <Textarea
                  id="crDecisionEdit"
                  className="min-h-[60px]"
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Update Change Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
