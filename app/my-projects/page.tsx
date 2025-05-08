"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getProjectsByOwner } from "@/services/project-service"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Filter } from "lucide-react"
import { LoadingAnimation } from "@/components/loading-animation"

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const fetchProjects = async () => {
      if (user?.uid) {
        try {
          const ownerProjects = await getProjectsByOwner(user.uid)
          setProjects(ownerProjects)
        } catch (error) {
          console.error("Error fetching projects:", error)
        } finally {
          setLoading(false)
        }
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

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <LoadingAnimation />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">Manage and track all your projects</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button onClick={handleCreateProject} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <PlusCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            You haven't created any projects yet. Start by creating your first project.
          </p>
          <Button onClick={handleCreateProject} className="mt-4">
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => handleEditProject(project.id)}
              showEditButton={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
