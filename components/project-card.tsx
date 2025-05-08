"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils/currency-utils"
import { Calendar, MapPin, Edit, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Project } from "@/types/project"

interface ProjectCardProps {
  project: Project
  onEdit?: () => void
  showEditButton?: boolean
}

export function ProjectCard({ project, onEdit, showEditButton = false }: ProjectCardProps) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const handleViewDetails = () => {
    router.push(`/project-details/${project.id}`)
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!project.cost || project.cost === 0) return 0
    const donations = project.donations || 0
    return Math.min(Math.round((donations / project.cost) * 100), 100)
  }

  // Get category image
  const getCategoryImage = (category: string) => {
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

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const progress = calculateProgress()

  return (
    <Card
      className="overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="h-48 overflow-hidden relative">
        <img
          src={getCategoryImage(project.category || "other")}
          alt={project.name}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
        />
        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="bg-white/90 text-gray-800">
            {project.category || "Other"}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold line-clamp-1">{project.name}</h3>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{project.location || "Unknown location"}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Calendar className="h-4 w-4 mr-1" />
          <span>Created: {formatDate(project.createdAt)}</span>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="mt-2">
          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Funding Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Raised: {formatCurrency(project.donations || 0)}</span>
            <span>Goal: {formatCurrency(project.cost || 0)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex gap-2">
        {showEditButton && (
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        <Button size="sm" className="flex-1" onClick={handleViewDetails}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}
