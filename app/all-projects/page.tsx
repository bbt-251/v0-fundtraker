"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getProjectsForGovernor, updateProjectApprovalStatus } from "@/services/project-service"
import type { Project } from "@/types/project"
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProjectModal } from "@/components/project-modal"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency-utils"
import { useToast } from "@/hooks/use-toast"

export default function AllProjectsPage() {
    const { userProfile, loading } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const [projects, setProjects] = useState<Project[]>([])
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [error, setError] = useState("")
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)

    // Rejection modal state
    const [showRejectionModal, setShowRejectionModal] = useState(false)
    const [projectToReject, setProjectToReject] = useState<string | null>(null)
    const [rejectionReason, setRejectionReason] = useState("")
    const [isProcessing, setIsProcessing] = useState(false)

    useEffect(() => {
        // Only Platform Governors should access this page
        if (!loading && userProfile && userProfile.role !== "Platform Governor") {
            router.push("/dashboard")
        }
    }, [loading, userProfile, router])

    useEffect(() => {
        async function fetchProjects() {
            if (!userProfile || userProfile.role !== "Platform Governor") return

            try {
                setLoadingProjects(true)
                const allProjects = await getProjectsForGovernor()
                setProjects(allProjects)
            } catch (error: any) {
                const errorMessage = error.message || "Failed to fetch projects"
                setError(errorMessage)
                toast({
                    title: "Error",
                    description: errorMessage,
                    variant: "destructive",
                })
            } finally {
                setLoadingProjects(false)
            }
        }

        fetchProjects()
    }, [userProfile, toast])

    const handleApproveProject = async (projectId: string) => {
        try {
            setProcessingId(projectId)
            setIsProcessing(true)

            await updateProjectApprovalStatus(projectId, "approved")

            // Update local state
            setProjects((prev) =>
                prev.map((project) => (project.id === projectId ? { ...project, approvalStatus: "approved" } : project)),
            )

            toast({
                title: "Project Approved",
                description: "Project has been approved and is now visible to donors.",
                variant: "default",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to approve project",
                variant: "destructive",
            })
        } finally {
            setProcessingId(null)
            setIsProcessing(false)
        }
    }

    const handleRejectClick = (projectId: string) => {
        setProjectToReject(projectId)
        setRejectionReason("")
        setShowRejectionModal(true)
    }

    const confirmRejectProject = async () => {
        if (!projectToReject || !rejectionReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a reason for rejection",
                variant: "destructive",
            })
            return
        }

        try {
            setIsProcessing(true)

            await updateProjectApprovalStatus(projectToReject, "rejected", rejectionReason)

            // Update local state
            setProjects((prev) =>
                prev.map((project) =>
                    project.id === projectToReject ? { ...project, approvalStatus: "rejected", rejectionReason } : project,
                ),
            )

            toast({
                title: "Project Rejected",
                description: "Project has been rejected. The project owner will be notified.",
                variant: "default",
            })
            setShowRejectionModal(false)
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to reject project",
                variant: "destructive",
            })
        } finally {
            setIsProcessing(false)
            setProjectToReject(null)
        }
    }

    const handleViewDetails = (projectId: string) => {
        setSelectedProjectId(projectId)
    }

    // Format date
    const formatDate = (dateString: any) => {
        if (!dateString) return "N/A"

        // Check if the dateString is a Firebase Timestamp
        if (dateString.toDate) {
            return new Date(dateString.toDate()).toLocaleDateString()
        }

        // Otherwise, assume it's a standard ISO string or Date
        return new Date(dateString).toLocaleDateString()
    }

    // Get status badge
    const getStatusBadge = (status?: string) => {
        switch (status) {
            case "approved":
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Approved</Badge>
            case "rejected":
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>
            case "pending":
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>
            default:
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Draft</Badge>
        }
    }

    if (loading || loadingProjects) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Projects</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Review and manage all projects in the platform</p>
            </div>

            {error ? (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">{error}</div>
            ) : projects.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">There are no projects in the system yet.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Owner</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Created On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">
                                            <div>
                                                <div className="font-medium">{project.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{project.location}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>{project.ownerName || "Unknown"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{project.category}</Badge>
                                        </TableCell>
                                        <TableCell>{formatCurrency(project.budget || project.cost || 0)}</TableCell>
                                        <TableCell>{formatDate(project.createdAt)}</TableCell>
                                        <TableCell>{getStatusBadge(project.approvalStatus)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => handleViewDetails(project.id)}>
                                                    <ExternalLink className="h-4 w-4 mr-1" />
                                                    Details
                                                </Button>

                                                {project.approvalStatus !== "rejected" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40"
                                                        onClick={() => handleRejectClick(project.id)}
                                                        disabled={isProcessing && processingId === project.id}
                                                    >
                                                        {isProcessing && processingId === project.id ? (
                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-4 w-4 mr-1" />
                                                        )}
                                                        Reject
                                                    </Button>
                                                )}

                                                {project.approvalStatus !== "approved" && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => handleApproveProject(project.id)}
                                                        disabled={isProcessing && processingId === project.id}
                                                    >
                                                        {isProcessing && processingId === project.id ? (
                                                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                                        ) : (
                                                            <CheckCircle className="h-4 w-4 mr-1" />
                                                        )}
                                                        Approve
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Project Modal */}
            {selectedProjectId && <ProjectModal projectId={selectedProjectId} onClose={() => setSelectedProjectId(null)} />}

            {/* Rejection Modal */}
            <ConfirmationModal
                isOpen={showRejectionModal}
                onClose={() => !isProcessing && setShowRejectionModal(false)}
                onConfirm={confirmRejectProject}
                title="Reject Project"
                message={
                    <div className="space-y-4">
                        <p>Please provide a reason for rejecting this project. This will be shown to the project owner.</p>
                        <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            rows={4}
                            className="w-full"
                            required
                        />
                    </div>
                }
                confirmText="Reject Project"
                cancelText="Cancel"
                type="danger"
                isLoading={isProcessing}
            />
        </div>
    )
}
