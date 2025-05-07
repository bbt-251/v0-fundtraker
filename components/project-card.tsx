"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MapPin, Calendar, DollarSign, ExternalLink, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/types/project"
import { useAuth } from "@/contexts/auth-context"
import { saveProject, unsaveProject } from "@/services/user-service"
import { useToast } from "@/components/ui/toast"

interface ProjectCardProps {
  project: Project
  isDonorView?: boolean
  isSaved?: boolean
  onSaveToggle?: (projectId: string, isSaved: boolean) => void
}

export function ProjectCard({ project, isDonorView = false, isSaved = false, onSaveToggle }: ProjectCardProps) {
  const { user, userProfile } = useAuth()
  const { success, error: showError } = useToast()
  const [isProjectSaved, setIsProjectSaved] = useState(isSaved)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    setIsProjectSaved(isSaved)
  }, [isSaved])

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

    return categoryImages[category.toLowerCase()] || categoryImages.other
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

  // Calculate total project cost
  const calculateTotalProjectCost = () => {
    if (project.cost) return project.cost

    const humanCost =
      project.humanResources?.reduce((total, resource) => {
        return total + resource.costPerDay * resource.quantity * 30
      }, 0) || 0

    const materialCost =
      project.materialResources?.reduce((total, resource) => {
        if (resource.costType === "one-time") {
          return total + resource.costAmount
        } else {
          return total + (resource.costAmount * 30) / resource.amortizationPeriod
        }
      }, 0) || 0

    return humanCost + materialCost
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalCost = calculateTotalProjectCost()
    const donations = project.donations || 0
    return totalCost > 0 ? Math.min(Math.round((donations / totalCost) * 100), 100) : 0
  }

  const handleSaveToggle = async () => {
    if (!user) {
      showError("Please log in to save projects")
      return
    }

    try {
      setIsToggling(true)

      if (isProjectSaved) {
        await unsaveProject(user.uid, project.id)
        success("Project removed from saved projects")
      } else {
        await saveProject(user.uid, project.id)
        success("Project saved successfully")
      }

      setIsProjectSaved(!isProjectSaved)

      // Notify parent component if callback provided
      if (onSaveToggle) {
        onSaveToggle(project.id, !isProjectSaved)
      }
    } catch (error: any) {
      showError(error.message || "Failed to update saved projects")
    } finally {
      setIsToggling(false)
    }
  }

  const progress = calculateProgress()
  const totalCost = calculateTotalProjectCost()

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg flex flex-col border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="h-40 overflow-hidden relative">
        <img
          src={getProjectImage(project.category) || "/placeholder.svg"}
          alt={project.name}
          className="w-full h-full object-cover"
        />
        {isDonorView && (
          <button
            onClick={handleSaveToggle}
            disabled={isToggling}
            className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-md disabled:opacity-50"
            aria-label={isProjectSaved ? "Unsave project" : "Save project"}
          >
            <Heart
              className={`h-5 w-5 ${isProjectSaved ? "fill-red-500 text-red-500" : "text-gray-400 dark:text-gray-300"}`}
            />
          </button>
        )}
      </div>
      <div className="p-4 flex-grow">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{project.name}</h3>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            {project.category}
          </Badge>
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{project.location || "Location not specified"}</span>
        </div>

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {project.description || "No description provided."}
        </p>

        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span>{progress}% Funded</span>
            <span>
              {formatCurrency(project.donations || 0)} / {formatCurrency(totalCost)}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 pt-0 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link href={`/project-details/${project.id}`}>
              <ExternalLink className="h-4 w-4 mr-1" />
              Details
            </Link>
          </Button>
          <Button size="sm" className="w-full" asChild>
            <Link href={`/donate/${project.id}`}>
              <DollarSign className="h-4 w-4 mr-1" />
              Donate
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
