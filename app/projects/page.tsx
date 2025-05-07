"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  getProjects,
  deleteProject,
  updateProjectStatus,
  getProjectsForGovernor,
  updateProjectApprovalStatus,
} from "@/services/project-service"
import type { Project, HumanResource, MaterialResource, ProjectApprovalStatus, ProjectMilestone } from "@/types/project"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Plus,
  Loader2,
  Calendar,
  MapPin,
  Edit,
  DollarSign,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Check,
  X,
} from "lucide-react"
import { ProjectModal } from "@/components/project-modal"
import { ConfirmationModal } from "@/components/confirmation-modal"
import { useToast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export default function ProjectsPage() {
  const { user, userProfile } = useAuth()
  const { success, error: showError } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const [showAnnounceModal, setShowAnnounceModal] = useState(false)
  const [projectToAnnounce, setProjectToAnnounce] = useState<{ id: string; announce: boolean } | null>(null)

  // Approval/rejection state
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [projectToApprove, setProjectToApprove] = useState<string | null>(null)
  const [projectToReject, setProjectToReject] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isProcessingApproval, setIsProcessingApproval] = useState(false)

  // Check if user is a platform governor - use the correct role name
  const isPlatformGovernor = userProfile?.role === "Platform Governor"

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return

      try {
        setLoading(true)
        let fetchedProjects: Project[]

        if (isPlatformGovernor) {
          // Platform governors see all projects
          fetchedProjects = await getProjectsForGovernor()
        } else {
          // Regular users only see their own projects
          fetchedProjects = await getProjects(user.uid)
        }

        setProjects(fetchedProjects)
      } catch (error: any) {
        const errorMessage = error.message || "Failed to fetch projects"
        setError(errorMessage)
        showError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user, showError, isPlatformGovernor, userProfile?.role])

  const handleDeleteProject = async (id: string) => {
    setProjectToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return

    try {
      setIsDeleting(true)
      setDeletingId(projectToDelete)
      await deleteProject(projectToDelete)

      // Find the project name for the success message
      const projectName = projects.find((p) => p.id === projectToDelete)?.name || "Project"

      setProjects((prev) => prev.filter((project) => project.id !== projectToDelete))
      setShowDeleteModal(false)
      setProjectToDelete(null)

      // Show success notification
      success(`${projectName} has been successfully deleted.`)
    } catch (error: any) {
      // Show error notification
      showError(error.message || "Failed to delete project")
      setError(error.message || "Failed to delete project")
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  const handleAnnounceToggle = (projectId: string, currentState: boolean, approvalStatus?: ProjectApprovalStatus) => {
    setProjectToAnnounce({ id: projectId, announce: !currentState })
    setShowAnnounceModal(true)
  }

  const confirmAnnounceToggle = async () => {
    if (!projectToAnnounce) return

    try {
      const project = projects.find((p) => p.id === projectToAnnounce.id)
      const isFirstAnnouncement = !project?.isAnnouncedToDonors

      // Update the project in the database
      await updateProjectStatus(projectToAnnounce.id, projectToAnnounce.announce, project?.isInExecution || false)

      // Update the local state
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id === projectToAnnounce.id) {
            return {
              ...project,
              isAnnouncedToDonors: projectToAnnounce.announce,
              // If it's the first announcement, set status to pending
              // Otherwise, keep the current status or set to approved for subsequent announcements
              approvalStatus: isFirstAnnouncement
                ? "pending"
                : projectToAnnounce.announce
                  ? "approved"
                  : project.approvalStatus,
            }
          }
          return project
        }),
      )

      // Show appropriate success notification
      if (projectToAnnounce.announce) {
        if (isFirstAnnouncement) {
          success("Project announcement submitted for approval. You will be notified once it's approved.")
        } else {
          success("Project is now visible to donors.")
        }
      } else {
        success("Project is now hidden from donors.")
      }
    } catch (error: any) {
      showError(error.message || "Failed to update project announcement status")
    } finally {
      setShowAnnounceModal(false)
      setProjectToAnnounce(null)
    }
  }

  // Handle project execution toggle
  const handleExecutionToggle = async (project: Project) => {
    // Check if the project has milestone budgets
    if (!project.milestoneBudgets || project.milestoneBudgets.length === 0) {
      showError("Cannot enable project execution. No milestone budgets defined.")
      return
    }

    // Get the total donations
    const totalDonations = project.donations || 0

    // Find the milestone budget with the earliest due date
    let earliestMilestoneBudget: { milestone: ProjectMilestone; budget: number } | null = null

    // First, create a map of milestone IDs to their budgets
    const milestoneBudgetMap = new Map<string, number>()
    project.milestoneBudgets.forEach((budget) => {
      milestoneBudgetMap.set(budget.milestoneId, budget.cost)
    })

    // Then find the milestone with the earliest date
    const milestones = project.milestones || []
    if (milestones.length === 0) {
      showError("Cannot enable project execution. No milestones defined.")
      return
    }

    // Sort milestones by date
    const sortedMilestones = [...milestones].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    // Find the earliest milestone that has a budget
    for (const milestone of sortedMilestones) {
      const budget = milestoneBudgetMap.get(milestone.id)
      if (budget !== undefined) {
        earliestMilestoneBudget = {
          milestone,
          budget,
        }
        break
      }
    }

    if (!earliestMilestoneBudget) {
      showError("Cannot enable project execution. No budget assigned to milestones.")
      return
    }

    // Check if the earliest milestone budget is less than or equal to total donations
    if (earliestMilestoneBudget.budget > totalDonations) {
      showError(
        `Cannot enable project execution. The earliest milestone "${earliestMilestoneBudget.milestone.name}" requires ${formatCurrency(earliestMilestoneBudget.budget)}, but only ${formatCurrency(totalDonations)} has been donated.`,
      )
      return
    }

    // If we get here, the condition is met, so we can toggle the execution status
    try {
      const newExecutionStatus = !project.isInExecution
      await updateProjectStatus(project.id, project.isAnnouncedToDonors || false, newExecutionStatus)

      // Update the local state
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === project.id) {
            return {
              ...p,
              isInExecution: newExecutionStatus,
            }
          }
          return p
        }),
      )

      success(`Project execution ${newExecutionStatus ? "started" : "stopped"} successfully.`)
    } catch (error: any) {
      showError(error.message || "Failed to update project execution status")
    }
  }

  // Handle project approval
  const handleApproveProject = (projectId: string) => {
    setProjectToApprove(projectId)
    setShowApprovalModal(true)
  }

  const confirmApproveProject = async () => {
    if (!projectToApprove) return

    try {
      setIsProcessingApproval(true)
      await updateProjectApprovalStatus(projectToApprove, "approved")

      // Update local state
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id === projectToApprove) {
            return {
              ...project,
              approvalStatus: "approved",
            }
          }
          return project
        }),
      )

      success("Project has been approved and is now visible to donors.")
    } catch (error: any) {
      showError(error.message || "Failed to approve project")
    } finally {
      setIsProcessingApproval(false)
      setShowApprovalModal(false)
      setProjectToApprove(null)
    }
  }

  // Handle project rejection
  const handleRejectProject = (projectId: string) => {
    setProjectToReject(projectId)
    setRejectionReason("")
    setShowRejectionModal(true)
  }

  const confirmRejectProject = async () => {
    if (!projectToReject || !rejectionReason.trim()) return

    try {
      setIsProcessingApproval(true)
      await updateProjectApprovalStatus(projectToReject, "rejected", rejectionReason)

      // Update local state
      setProjects((prev) =>
        prev.map((project) => {
          if (project.id === projectToReject) {
            return {
              ...project,
              approvalStatus: "rejected",
              rejectionReason: rejectionReason,
            }
          }
          return project
        }),
      )

      success("Project has been rejected. The owner will be notified.")
    } catch (error: any) {
      showError(error.message || "Failed to reject project")
    } finally {
      setIsProcessingApproval(false)
      setShowRejectionModal(false)
      setProjectToReject(null)
      setRejectionReason("")
    }
  }

  // Function to get a random image for project cards
  const getProjectImage = (category: string) => {
    const categoryImages: Record<string, string> = {
      environment: "/serene-mountain-lake.png",
      education: "/education-books.png",
      healthcare: "/interconnected-healthcare.png",
      technology: "/digital-technology.png",
      agriculture: "/agriculture-farm.png",
      other: "/collaborative-business-project.png",
    }

    return categoryImages[category] || categoryImages.other
  }

  // Calculate human resource cost - same as in financial resource tab
  const calculateHumanResourceCost = (resources: HumanResource[]) => {
    return resources.reduce((total, resource) => {
      return total + resource.costPerDay * resource.quantity * 30 // Assuming 30 days as default
    }, 0)
  }

  // Calculate material resource cost - same as in financial resource tab
  const calculateMaterialResourceCost = (resources: MaterialResource[]) => {
    return resources.reduce((total, resource) => {
      // For one-time costs, just return the amount
      if (resource.costType === "one-time") {
        return total + resource.costAmount
      }
      // For recurring costs, calculate based on amortization period (assuming 30 days as default)
      return total + (resource.costAmount * 30) / resource.amortizationPeriod
    }, 0)
  }

  // Function to calculate project donations vs cost
  const calculateDonationProgress = (project: Project) => {
    // Calculate the total project cost using the same formula as in the financial resource tab
    const humanResourceTotal = calculateHumanResourceCost(project.humanResources || [])
    const materialResourceTotal = calculateMaterialResourceCost(project.materialResources || [])
    const totalProjectCost = humanResourceTotal + materialResourceTotal

    // Get donations (or use 0 if not available)
    const donations = project.donations || 0

    const percentage = totalProjectCost > 0 ? Math.min(Math.round((donations / totalProjectCost) * 100), 100) : 0
    return {
      percentage,
      donations,
      cost: totalProjectCost,
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Function to check if a project is fully defined
  const isProjectFullyDefined = (project: Project) => {
    // Check human resources
    const hasHumanResources = project.humanResources && project.humanResources.length > 0

    // Check material resources
    const hasMaterialResources = project.materialResources && project.materialResources.length > 0

    // Check project planning
    const hasActivities = project.activities && project.activities.length > 0
    const hasTasks = project.tasks && project.tasks.length > 0
    const hasDeliverables = project.deliverables && project.deliverables.length > 0
    const hasMilestones = project.milestones && project.milestones.length > 0
    const hasDecisionGates = project.decisionGates && project.decisionGates.length > 0

    // Check project risks
    const hasRisks = project.risks && project.risks.length > 0

    // Check project communication
    const hasCommunicationPlan = !!project.communicationPlan
    const hasSocialMedia = project.socialMediaAccounts && project.socialMediaAccounts.length > 0
    const hasOtherMediums = project.communicationMediums && project.communicationMediums.length > 0

    return (
      hasHumanResources &&
      hasMaterialResources &&
      hasActivities &&
      hasTasks &&
      hasDeliverables &&
      hasMilestones &&
      hasDecisionGates &&
      hasRisks &&
      hasCommunicationPlan &&
      hasSocialMedia &&
      hasOtherMediums
    )
  }

  const handleEditProject = (projectId: string) => {
    router.push(`/edit-project?id=${projectId}`)
  }

  const handleViewDetails = (projectId: string) => {
    setSelectedProjectId(projectId)
  }

  // Function to render approval status badge
  const renderApprovalBadge = (status?: ProjectApprovalStatus) => {
    if (!status) return null

    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800 flex items-center gap-1"
          >
            <AlertCircle className="h-3 w-3" />
            Pending Approval
          </Badge>
        )
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800 flex items-center gap-1"
          >
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isPlatformGovernor ? "All Projects" : "Projects"}
        </h1>
        {!isPlatformGovernor && (
          <Link
            href="/createNewProject"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects found</h3>
          {isPlatformGovernor ? (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              There are no projects created by project owners yet.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new project.</p>
              <div className="mt-6">
                <Link
                  href="/createNewProject"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const progress = calculateDonationProgress(project)
            const isFullyDefined = isProjectFullyDefined(project)
            const canAnnounce = !isPlatformGovernor && isFullyDefined
            const isPending = project.approvalStatus === "pending"

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-900 overflow-hidden rounded-lg flex flex-col border border-gray-800"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={getProjectImage(project.category) || "/placeholder.svg"}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    {renderApprovalBadge(project.approvalStatus)}
                  </div>

                  <div className="flex items-center text-sm text-gray-400 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{project.location || "AA"}</span>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center text-sm text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-blue-400">{project.category}</span>
                    </div>
                  </div>

                  {isPlatformGovernor && (
                    <div className="mt-2 text-sm text-gray-400 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>Owner: {project.ownerName || "Unknown"}</span>
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span className="text-gray-400">{progress.percentage}% Complete</span>
                      <span className="text-gray-400">
                        {formatCurrency(progress.donations)} / {formatCurrency(progress.cost)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Announce to donors</span>
                      <Switch
                        disabled={!canAnnounce || project.approvalStatus === "pending"}
                        checked={project.isAnnouncedToDonors || false}
                        onCheckedChange={() =>
                          handleAnnounceToggle(project.id, project.isAnnouncedToDonors || false, project.approvalStatus)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Project execution</span>
                      <Switch
                        disabled={isPlatformGovernor}
                        checked={project.isInExecution || false}
                        onCheckedChange={() => handleExecutionToggle(project)}
                      />
                    </div>
                  </div>

                  {/* Different action buttons for platform governors vs project owners */}
                  {isPlatformGovernor ? (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent border-green-700 text-green-400 hover:bg-green-900/30"
                            onClick={() => handleApproveProject(project.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-transparent border-red-700 text-red-400 hover:bg-red-900/30"
                            onClick={() => handleRejectProject(project.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        className={`w-full bg-blue-600 hover:bg-blue-700 text-white ${isPending ? "" : "col-span-3"}`}
                        onClick={() => handleViewDetails(project.id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
                        onClick={() => handleEditProject(project.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent border-gray-700 text-white hover:bg-gray-800"
                      >
                        <DollarSign className="h-4 w-4 mr-1" />
                        View Donations
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleViewDetails(project.id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Project Modal */}
      {selectedProjectId && <ProjectModal projectId={selectedProjectId} onClose={() => setSelectedProjectId(null)} />}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={confirmDeleteProject}
        title="Delete Project"
        message="Are you sure you want to delete this project? This action cannot be undone and all associated documents will be permanently deleted."
        confirmText="Delete Project"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
      />

      {/* Announce Confirmation Modal */}
      <ConfirmationModal
        isOpen={showAnnounceModal}
        onClose={() => setShowAnnounceModal(false)}
        onConfirm={confirmAnnounceToggle}
        title={projectToAnnounce?.announce ? "Announce Project" : "Hide Project"}
        message={
          projectToAnnounce?.announce
            ? projects.find((p) => p.id === projectToAnnounce?.id)?.isAnnouncedToDonors
              ? "Are you sure you want to announce this project to donors? They will be able to see all project details and make donations."
              : "This project will be submitted for approval by a platform governor before it becomes visible to donors. Continue?"
            : "Are you sure you want to hide this project from donors? They will no longer be able to see this project or make donations."
        }
        confirmText={projectToAnnounce?.announce ? "Announce Project" : "Hide Project"}
        cancelText="Cancel"
        type={projectToAnnounce?.announce ? "info" : "warning"}
      />

      {/* Approval Confirmation Modal */}
      <ConfirmationModal
        isOpen={showApprovalModal}
        onClose={() => !isProcessingApproval && setShowApprovalModal(false)}
        onConfirm={confirmApproveProject}
        title="Approve Project"
        message="Are you sure you want to approve this project? It will become visible to donors and they will be able to make donations."
        confirmText="Approve Project"
        cancelText="Cancel"
        type="success"
        isLoading={isProcessingApproval}
      />

      {/* Rejection Modal with Reason */}
      <ConfirmationModal
        isOpen={showRejectionModal}
        onClose={() => !isProcessingApproval && setShowRejectionModal(false)}
        onConfirm={confirmRejectProject}
        title="Reject Project"
        message="Please provide a reason for rejecting this project. This will be shared with the project owner."
        confirmText="Reject Project"
        cancelText="Cancel"
        type="danger"
        isLoading={isProcessingApproval}
        customContent={
          <div className="mt-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full h-24"
              required
            />
          </div>
        }
        confirmDisabled={!rejectionReason.trim()}
      />
    </div>
  )
}
