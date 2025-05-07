"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getProjectsAwaitingApproval, updateProjectApprovalStatus } from "@/services/project-service"
import type { Project } from "@/types/project"
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { ProjectModal } from "@/components/project-modal"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { useRouter } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"

export default function ProjectApprovalsPage() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Rejection modal state
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [projectToReject, setProjectToReject] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Check if user is a platform governor
  useEffect(() => {
    if (userProfile && userProfile.role !== "platform_governor") {
      router.push("/dashboard")
    }
  }, [userProfile, router])

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return

      try {
        setLoading(true)
        const pendingProjects = await getProjectsAwaitingApproval()
        setProjects(pendingProjects)
      } catch (error: any) {
        const errorMessage = error.message || "Failed to fetch projects awaiting approval"
        setError(errorMessage)
        showError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user, showError])

  const handleApproveProject = async (projectId: string) => {
    try {
      setProcessingId(projectId)
      setIsProcessing(true)

      await updateProjectApprovalStatus(projectId, "approved")

      // Update local state
      setProjects((prev) => prev.filter((project) => project.id !== projectId))

      success("Project has been approved and is now visible to donors.")
    } catch (error: any) {
      showError(error.message || "Failed to approve project")
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
      showError("Please provide a reason for rejection")
      return
    }

    try {
      setIsProcessing(true)

      await updateProjectApprovalStatus(projectToReject, "rejected", rejectionReason)

      // Update local state
      setProjects((prev) => prev.filter((project) => project.id !== projectToReject))

      success("Project has been rejected. The project owner will be notified.")
      setShowRejectionModal(false)
    } catch (error: any) {
      showError(error.message || "Failed to reject project")
    } finally {
      setIsProcessing(false)
      setProjectToReject(null)
    }
  }

  const handleViewDetails = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects Awaiting Approval</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review and approve projects before they become visible to donors
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
          <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects awaiting approval</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            All projects have been reviewed. Check back later for new submissions.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Project
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Owner
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Submitted On
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{project.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{project.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{project.ownerName || "Unknown"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {project.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {project.announcementDate ? new Date(project.announcementDate).toLocaleDateString() : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(project.id)}>
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Details
                        </Button>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
