"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertTriangle, Edit, Trash2, AlertCircle, Info, Upload } from "lucide-react"
import type { ProjectActivity, ProjectRisk } from "@/types/project"
import { deleteProjectRisk } from "@/services/project-service"
import { useToast } from "@/hooks/use-toast"
import { ImportRiskModal } from "./modals/import_risk_modal"

interface RisksListTabProps {
    projectId: string
    risks: ProjectRisk[]
    onRiskUpdated: (risk: ProjectRisk) => void
    onRiskDeleted: (riskId: string) => void
    activities: ProjectActivity[]
}

export function RisksListTab({ projectId, risks, onRiskUpdated, onRiskDeleted, activities }: RisksListTabProps) {
    const [loading, setLoading] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedRisk, setSelectedRisk] = useState<ProjectRisk | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const { toast } = useToast()
    const [importModalOpen, setImportModalOpen] = useState(false);

    const handleDelete = async () => {
        if (!selectedRisk) return

        try {
            setLoading(true)
            await deleteProjectRisk(projectId, selectedRisk.id)
            onRiskDeleted(selectedRisk.id)
            toast({
                title: "Risk deleted",
                description: `${selectedRisk.name} has been deleted.`,
            })
        } catch (error) {
            console.error("Error deleting risk:", error)
            toast({
                title: "Error deleting risk",
                description: "There was an error deleting the risk. Please try again.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
            setDeleteDialogOpen(false)
        }
    }

    const handleViewDetails = (risk: ProjectRisk) => {
        setSelectedRisk(risk)
        setDetailsDialogOpen(true)
    }

    const handleEdit = (risk: ProjectRisk) => {
        // Implement edit functionality
        console.log("Edit risk:", risk)
    }

    const handleDeleteClick = (risk: ProjectRisk) => {
        setSelectedRisk(risk)
        setDeleteDialogOpen(true)
    }

    const getRiskLevelIcon = (impact: number, probability: number) => {
        const riskScore = impact * probability

        if (riskScore >= 16) {
            return <AlertCircle className="h-4 w-4 text-red-500" />
        } else if (riskScore >= 9) {
            return <AlertTriangle className="h-4 w-4 text-amber-500" />
        } else {
            return <Info className="h-4 w-4 text-green-500" />
        }
    }

    const getRiskLevelText = (impact: number, probability: number) => {
        const riskScore = impact * probability

        if (riskScore >= 16) {
            return "High"
        } else if (riskScore >= 9) {
            return "Medium"
        } else {
            return "Low"
        }
    }

    const getRiskLevelColor = (impact: number, probability: number) => {
        const riskScore = impact * probability

        if (riskScore >= 16) {
            return "text-red-500"
        } else if (riskScore >= 9) {
            return "text-amber-500"
        } else {
            return "text-green-500"
        }
    }

    return (
        <div className="bg-[#1a2332] text-white rounded-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold mb-4">Project Risks</h2>
                <div className="flex space-x-2">
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

            {risks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">No risks have been added to this project yet.</div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-[#0f172a]">
                            <TableRow className="border-b border-gray-700 hover:bg-[#1e293b]">
                                <TableHead className="text-gray-300">Risk Name</TableHead>
                                <TableHead className="text-gray-300">Impact</TableHead>
                                <TableHead className="text-gray-300">Probability</TableHead>
                                <TableHead className="text-gray-300">Risk Rating</TableHead>
                                <TableHead className="text-gray-300">Status</TableHead>
                                <TableHead className="text-right text-gray-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {risks.map((risk) => (
                                <TableRow
                                    key={risk.id}
                                    className="border-b border-gray-700 cursor-pointer hover:bg-[#1e293b]"
                                    onClick={() => handleViewDetails(risk)}
                                >
                                    <TableCell className="font-medium text-white">{risk.name}</TableCell>
                                    <TableCell className="text-gray-300">{risk.impact}</TableCell>
                                    <TableCell className="text-gray-300">{risk.probability}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {getRiskLevelIcon(risk.impact, risk.probability)}
                                            <span className={`font-medium ${getRiskLevelColor(risk.impact, risk.probability)}`}>
                                                {risk.riskScore} ({getRiskLevelText(risk.impact, risk.probability)})
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={risk.status === "Active" ? "destructive" : "outline"}>{risk.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="hover:bg-[#2d3748] text-gray-300">
                                                <Edit className="h-4 w-4" onClick={() => handleEdit(risk)} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="hover:bg-[#2d3748] text-gray-300">
                                                <Trash2 className="h-4 w-4" onClick={() => handleDeleteClick(risk)} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="bg-[#1a2332] text-white border border-gray-700">
                    <DialogHeader>
                        <DialogTitle>Delete Risk</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete the risk "{selectedRisk?.name}"? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={loading}
                            className="border-gray-600 hover:bg-[#2d3748] hover:text-white"
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Risk Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-3xl bg-[#1a2332] text-white border border-gray-700">
                    <DialogHeader>
                        <DialogTitle>{selectedRisk?.name}</DialogTitle>
                    </DialogHeader>

                    {selectedRisk && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Description</h3>
                                <p className="mt-1 text-white">{selectedRisk.description}</p>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400">Impact</h3>
                                    <p className="mt-1 font-medium text-white">{selectedRisk.impact}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400">Probability</h3>
                                    <p className="mt-1 font-medium text-white">{selectedRisk.probability}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400">Risk Rating</h3>
                                    <div className="mt-1 flex items-center gap-1">
                                        {getRiskLevelIcon(selectedRisk.impact, selectedRisk.probability)}
                                        <span className={`font-medium ${getRiskLevelColor(selectedRisk.impact, selectedRisk.probability)}`}>
                                            {selectedRisk.riskScore} ({getRiskLevelText(selectedRisk.impact, selectedRisk.probability)})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-gray-400">Status</h3>
                                <div className="mt-1">
                                    <Badge variant={selectedRisk.status === "Active" ? "destructive" : "outline"}>
                                        {selectedRisk.status}
                                    </Badge>
                                </div>
                            </div>

                            {selectedRisk.mitigationActions && selectedRisk.mitigationActions.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400">Mitigation Actions</h3>
                                    <ul className="mt-1 list-disc pl-5 space-y-1 text-white">
                                        {selectedRisk.mitigationActions.map((action) => (
                                            <li key={action.id}>{action.description}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedRisk.associatedActivities && selectedRisk.associatedActivities.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-400">Associated Activities</h3>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {selectedRisk.associatedActivities.map((activityId) => (
                                            <Badge key={activityId} variant="outline" className="border-gray-600">
                                                {activityId}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDetailsDialogOpen(false)}
                            className="border-gray-600 hover:bg-[#2d3748] hover:text-white"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ImportRiskModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                activities={activities}
                onRisksImported={(risks) => {
                    risks.forEach((risk) => {
                        onRiskUpdated(risk)
                    })
                }}
                projectId={projectId}
            />
        </div>
    )
}
