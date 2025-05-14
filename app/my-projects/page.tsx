"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getProjects, updateProjectApprovalStatus } from "@/services/project-service"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Plus, Loader2 } from "lucide-react"
import type { Project } from "@/types/project"
import { toast } from "@/components/ui/use-toast"
import { ConfirmationModal } from "@/components/confirmation-modal"

export default function MyProjectsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // State for approval request modal
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [projectToApprove, setProjectToApprove] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return

      try {
        setLoading(true)
        const userProjects = await getProjects(user.uid)
        setProjects(userProjects)
      } catch (error: any) {
        console.error("Error fetching projects:", error)
        setError(error.message || "Failed to fetch projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [user])

  const handleCreateProject = () => {
    router.push("/createNewProject")
  }

  const handleEditProject = (projectId: string) => {
    router.push(`/edit-project?id=${projectId}`)
  }

  const handleRequestApproval = (projectId: string) => {
    setProjectToApprove(projectId)
    setShowApprovalModal(true)
  }

  const submitApprovalRequest = async () => {
    if (!projectToApprove) return

    try {
      // Update project status to "pending" approval
      const projectToUpdate = projects.find((p) => p.id === projectToApprove)
      if (projectToUpdate) {
        // Update the project's approvalStatus to "pending"
        const updatedProject = { ...projectToUpdate, approvalStatus: "pending" as const }

        // Call the API to update the project
        await updateProjectApprovalStatus(projectToApprove, "pending")

        // Update local state
        setProjects(projects.map((p) => (p.id === projectToApprove ? updatedProject : p)))

        toast({
          title: "Approval request submitted",
          description: "Your project has been submitted for approval by a platform governor.",
        })
      }
    } catch (error) {
      console.error("Error requesting approval:", error)
      toast({
        title: "Error",
        description: "Failed to submit approval request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setShowApprovalModal(false)
      setProjectToApprove(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Projects</h1>
        <Button onClick={handleCreateProject}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by creating a new project.</p>
          <Button onClick={handleCreateProject} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create New Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              showEditButton
              onEdit={() => handleEditProject(project.id)}
              onRequestApproval={handleRequestApproval}
            />
          ))}
        </div>
      )}

      {/* Approval Request Modal */}
      <ConfirmationModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onConfirm={submitApprovalRequest}
        title="Request Project Approval"
        message="Your project will be submitted for approval by a platform governor. Once approved, you'll be able to announce it to donors. Do you want to proceed?"
        confirmText="Submit for Approval"
        cancelText="Cancel"
      />
    </div>
  )
}
