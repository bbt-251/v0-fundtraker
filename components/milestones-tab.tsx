"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, Plus, Loader2, Upload } from "lucide-react"
import { formatDate } from "@/lib/utils/date-utils"
import {
    getProject,
    addProjectMilestone,
    updateProjectMilestone,
    deleteProjectMilestone,
} from "@/services/project-service"
import type { ProjectMilestone, ProjectDeliverable } from "@/types/project"
import { DatePicker } from "@/components/ui/ant-date-picker"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ImportMilestonesModal } from "./modals/import_milestones_modal"

interface MilestonesTabProps {
    projectId: string
}

export function MilestonesTab({ projectId }: MilestonesTabProps) {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false) // New state for delete dialog
    const [milestoneToDelete, setMilestoneToDelete] = useState<string | null>(null) // Track milestone to delete
    const [isDeleting, setIsDeleting] = useState(false) // Loading state for delete action
    const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null)
    const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
    const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false) // New state for button loading
    const [importModalOpen, setImportModalOpen] = useState(false)

    // Form state
    const [milestoneName, setMilestoneName] = useState("")
    const [description, setDescription] = useState("")
    const [date, setDate] = useState<Date | undefined>()
    const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([])

    // Error handling
    const [nameError, setNameError] = useState("")
    const [dateError, setDateError] = useState("")

    // Fetch project data
    useEffect(() => {
        const fetchProject = async () => {
            try {
                setIsLoading(true)
                const project = await getProject(projectId)
                if (project) {
                    setMilestones(project.milestones || [])
                    setDeliverables(project.deliverables || [])
                }
            } catch (error) {
                console.error("Error fetching project:", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProject()
    }, [projectId])

    const resetForm = () => {
        setMilestoneName("")
        setDescription("")
        setDate(undefined)
        setSelectedDeliverables([])
        setEditingMilestone(null)
        setNameError("")
        setDateError("")
    }

    const handleOpenDialog = (milestone?: ProjectMilestone) => {
        resetForm()

        if (milestone) {
            setEditingMilestone(milestone)
            setMilestoneName(milestone.name)
            setDescription(milestone.description)
            setDate(milestone.date ? new Date(milestone.date) : undefined)
            setSelectedDeliverables(milestone.associatedDeliverables || [])
        }

        setDialogOpen(true)
    }

    const validateForm = () => {
        let isValid = true

        if (!milestoneName.trim()) {
            setNameError("Milestone name is required")
            isValid = false
        } else {
            setNameError("")
        }

        if (!date) {
            setDateError("Date is required")
            isValid = false
        } else {
            setDateError("")
        }

        return isValid
    }

    const handleSubmit = async () => {
        if (!validateForm()) return

        try {
            setIsSubmitting(true) // Start loading
            const milestoneData: Omit<ProjectMilestone, "id" | "createdAt"> = {
                name: milestoneName,
                description,
                date: date ? format(date, "yyyy-MM-dd") : "",
                associatedDeliverables: selectedDeliverables,
                status: "Not Started"
            }

            if (editingMilestone) {
                await updateProjectMilestone(projectId, editingMilestone.id, milestoneData)

                // Update local state
                setMilestones(milestones.map((m) => (m.id === editingMilestone.id ? { ...m, ...milestoneData } : m)))
            } else {
                await addProjectMilestone(projectId, milestoneData)

                // Refresh the data
                const project = await getProject(projectId)
                if (project) {
                    setMilestones(project.milestones || [])
                }
            }

            setDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error("Error saving milestone:", error)
        } finally {
            setIsSubmitting(false) // Stop loading
        }
    }

    const handleDelete = async () => {
        if (!milestoneToDelete) return

        try {
            setIsDeleting(true) // Start loading
            await deleteProjectMilestone(projectId, milestoneToDelete)
            setMilestones(milestones.filter((m) => m.id !== milestoneToDelete))
            setDeleteDialogOpen(false) // Close the dialog
        } catch (error) {
            console.error("Error deleting milestone:", error)
        } finally {
            setIsDeleting(false) // Stop loading
            setMilestoneToDelete(null) // Reset milestone to delete
        }
    }

    const openDeleteDialog = (milestoneId: string) => {
        setMilestoneToDelete(milestoneId)
        setDeleteDialogOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Project Milestones</h3>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex space-x-2">
                        <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Add Milestone
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setImportModalOpen(true)}
                            className="flex items-center"
                        >
                            <Upload className="mr-1 h-4 w-4" />
                            Import
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-4">Loading milestones...</div>
            ) : milestones.length === 0 ? (
                <div className="text-center py-8 bg-muted/20 rounded-lg border">
                    <p className="text-muted-foreground">No milestones have been added yet.</p>
                    <Button variant="link" onClick={() => handleOpenDialog()} className="mt-2">
                        Add your first milestone
                    </Button>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Milestone Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Associated Deliverables</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {milestones.map((milestone) => (
                            <TableRow key={milestone.id}>
                                <TableCell className="font-medium">{milestone.name}</TableCell>
                                <TableCell className="max-w-xs truncate">{milestone.description || "—"}</TableCell>
                                <TableCell>{milestone.date ? formatDate(new Date(milestone.date)) : "—"}</TableCell>
                                <TableCell>
                                    {milestone.associatedDeliverables && milestone.associatedDeliverables.length > 0
                                        ? milestone.associatedDeliverables
                                            .map((id) => {
                                                const deliverable = deliverables.find((d) => d.id === id)
                                                return deliverable ? deliverable.name : ""
                                            })
                                            .join(", ")
                                        : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(milestone)}>
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog(milestone.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <DialogTitle>{editingMilestone ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
                        <DialogDescription>
                            {editingMilestone ? "Update the milestone details below." : "Enter the details of the new milestone."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="milestoneName" className="flex items-center gap-1">
                                Milestone Name
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="milestoneName"
                                value={milestoneName}
                                onChange={(e) => setMilestoneName(e.target.value)}
                                placeholder="Enter milestone name"
                                className={cn(nameError && "border-red-500")}
                            />
                            {nameError && <span className="text-sm text-red-500">{nameError}</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter milestone description"
                                rows={4}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="date" className="flex items-center gap-1">
                                Date
                                <span className="text-red-500">*</span>
                            </Label>
                            <DatePicker
                                value={date}
                                onChange={(date) => setDate(date || undefined)}
                                placeholder="Select date"
                                className={cn(dateError && "border-red-500")}
                            />
                            {dateError && <span className="text-sm text-red-500">{dateError}</span>}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="deliverables">Associated Deliverables</Label>
                            {deliverables.length > 0 ? (
                                <Select
                                    onValueChange={(value) => setSelectedDeliverables([value])}
                                    value={selectedDeliverables[0] || ""}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a deliverable" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {deliverables.map((deliverable) => (
                                            <SelectItem key={deliverable.id} value={deliverable.id}>
                                                {deliverable.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="bg-muted p-2 rounded text-muted-foreground text-sm">No deliverables available</div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {editingMilestone ? "Updating..." : "Adding..."}
                                </span>
                            ) : (
                                editingMilestone ? "Update Milestone" : "Add Milestone"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Milestone</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this milestone? This action cannot be undone.</p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button" disabled={isDeleting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ImportMilestonesModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                deliverables={deliverables}
                onMilestonesImported={(milestones) => setMilestones((milestone) => [...milestone, ...milestones])}
                projectId={projectId}
            />
        </div>
    )
}
