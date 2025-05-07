"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingAnimation } from "@/components/loading-animation"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { getProject, addDecisionGate, updateDecisionGate, deleteDecisionGate } from "@/services/project-service"
import type { DecisionGate, Participant, Project } from "@/types/project"
import { CalendarIcon, PlusIcon, Trash2Icon, PencilIcon, CheckIcon, XIcon } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface DecisionGatesTabProps {
  projectId: string
}

export function DecisionGatesTab({ projectId }: DecisionGatesTabProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [selectedGate, setSelectedGate] = useState<DecisionGate | null>(null)
  const [gateToDelete, setGateToDelete] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState<string>("")
  const [videoConferenceLink, setVideoConferenceLink] = useState<string>("")
  const [dateTime, setDateTime] = useState<string>("")
  const [objective, setObjective] = useState<string>("")
  const [participants, setParticipants] = useState<Participant[]>([])
  const [newParticipant, setNewParticipant] = useState<string>("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const projectData = await getProject(projectId)
        if (projectData) {
          setProject(projectData)
        } else {
          setError("Project not found")
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project data")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const resetForm = () => {
    setName("")
    setVideoConferenceLink("")
    setDateTime("")
    setObjective("")
    setParticipants([])
    setNewParticipant("")
    setFormErrors({})
    setSelectedGate(null)
  }

  const openAddModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (gate: DecisionGate) => {
    setSelectedGate(gate)
    setName(gate.name)
    setVideoConferenceLink(gate.videoConferenceLink)
    setDateTime(gate.dateTime)
    setObjective(gate.objective)
    setParticipants(gate.participants || [])
    setIsModalOpen(true)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!name.trim()) {
      errors.name = "Name is required"
    }

    if (!dateTime) {
      errors.dateTime = "Date & Time is required"
    }

    if (!objective.trim()) {
      errors.objective = "Objective is required"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddParticipant = () => {
    if (newParticipant.trim()) {
      setParticipants([...participants, { id: uuidv4(), name: newParticipant.trim() }])
      setNewParticipant("")
    }
  }

  const handleRemoveParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id))
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      if (selectedGate) {
        // Update existing gate
        await updateDecisionGate(projectId, selectedGate.id, {
          name,
          videoConferenceLink,
          dateTime,
          objective,
          participants,
        })
      } else {
        // Add new gate
        await addDecisionGate(projectId, {
          name,
          videoConferenceLink,
          dateTime,
          objective,
          participants,
        })
      }

      // Refresh project data
      const updatedProject = await getProject(projectId)
      setProject(updatedProject)
      setIsModalOpen(false)
      resetForm()
    } catch (err) {
      console.error("Error saving decision gate:", err)
      setError("Failed to save decision gate")
    }
  }

  const confirmDelete = (gateId: string) => {
    setGateToDelete(gateId)
    setIsDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!gateToDelete) return

    try {
      await deleteDecisionGate(projectId, gateToDelete)

      // Refresh project data
      const updatedProject = await getProject(projectId)
      setProject(updatedProject)
      setIsDeleteModalOpen(false)
      setGateToDelete(null)
    } catch (err) {
      console.error("Error deleting decision gate:", err)
      setError("Failed to delete decision gate")
    }
  }

  const handleUpdateStatus = async (gateId: string, status: "Scheduled" | "Completed" | "Cancelled") => {
    try {
      await updateDecisionGate(projectId, gateId, { status })

      // Refresh project data
      const updatedProject = await getProject(projectId)
      setProject(updatedProject)
    } catch (err) {
      console.error("Error updating decision gate status:", err)
      setError("Failed to update decision gate status")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Scheduled
          </Badge>
        )
      case "Completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        )
      case "Cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingAnimation />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  const decisionGates = project?.decisionGates || []

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Decision Gates</h3>
        <Button onClick={openAddModal}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add New Decision Gate
        </Button>
      </div>

      {decisionGates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No decision gates have been added yet.</p>
            <Button variant="outline" className="mt-4" onClick={openAddModal}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Your First Decision Gate
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Objective</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisionGates.map((gate) => (
                  <TableRow key={gate.id}>
                    <TableCell className="font-medium">{gate.name}</TableCell>
                    <TableCell>{gate.dateTime}</TableCell>
                    <TableCell className="max-w-xs truncate">{gate.objective}</TableCell>
                    <TableCell>{gate.participants?.length || 0} participants</TableCell>
                    <TableCell>{getStatusBadge(gate.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {gate.status === "Scheduled" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateStatus(gate.id, "Completed")}
                              title="Mark as Completed"
                            >
                              <CheckIcon className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleUpdateStatus(gate.id, "Cancelled")}
                              title="Mark as Cancelled"
                            >
                              <XIcon className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditModal(gate)}>
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(gate.id)}>
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Decision Gate Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGate ? "Edit Decision Gate" : "Add New Decision Gate"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name*
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter gate name"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="videoConferenceLink" className="text-sm font-medium">
                Video Conference Link*
              </label>
              <Input
                id="videoConferenceLink"
                value={videoConferenceLink}
                onChange={(e) => setVideoConferenceLink(e.target.value)}
                placeholder="Enter video conference link"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="dateTime" className="text-sm font-medium">
                Date & Time*
              </label>
              <div className="flex">
                <Input
                  id="dateTime"
                  type="datetime-local"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className={formErrors.dateTime ? "border-red-500" : ""}
                />
                <Button variant="outline" size="icon" className="ml-2">
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
              {formErrors.dateTime && <p className="text-xs text-red-500">{formErrors.dateTime}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="objective" className="text-sm font-medium">
                Objective*
              </label>
              <Textarea
                id="objective"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Enter objective"
                className={formErrors.objective ? "border-red-500" : ""}
              />
              {formErrors.objective && <p className="text-xs text-red-500">{formErrors.objective}</p>}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">Participants</label>
              <div className="flex gap-2">
                <Input
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  placeholder="Add participant"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddParticipant()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddParticipant}>
                  Add
                </Button>
              </div>

              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No participants added yet</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between bg-muted p-2 rounded-md">
                      <span>{participant.name}</span>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveParticipant(participant.id)}>
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{selectedGate ? "Update Decision Gate" : "Add Decision Gate"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Decision Gate"
        message="Are you sure you want to delete this decision gate? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
