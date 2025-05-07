"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getAnnouncedProjects } from "@/services/project-service"
import { getSavedProjects } from "@/services/user-service"
import type { Project } from "@/types/project"
import { Search, TrendingUp, Bookmark } from "lucide-react"
import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"

// Define project categories
const CATEGORIES = [
  "Education",
  "Healthcare",
  "Environment",
  "Technology",
  "Arts",
  "Community",
  "Disaster Relief",
  "Animal Welfare",
]

export default function DonorDashboard() {
  const { user, userProfile } = useAuth()
  const { error: showError } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [savedProjectIds, setSavedProjectIds] = useState<string[]>([])

  // Fetch announced projects and saved projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const announcedProjects = await getAnnouncedProjects()
        setProjects(announcedProjects)
        setFilteredProjects(announcedProjects)

        // Fetch saved projects if user is logged in
        if (user) {
          const savedIds = await getSavedProjects(user.uid)
          setSavedProjectIds(savedIds)
        }
      } catch (error: any) {
        showError(error.message || "Failed to fetch projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [showError, user])

  // Filter projects based on search, categories, and urgency
  useEffect(() => {
    let result = [...projects]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query)) ||
          (project.location && project.location.toLowerCase().includes(query)),
      )
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      result = result.filter((project) => selectedCategories.includes(project.category))
    }

    // Filter by urgency (placeholder - we'll need to add an urgency field to projects)
    if (urgentOnly) {
      result = result.filter((project) => project.isUrgent)
    }

    // Filter by tab
    if (activeTab === "trending") {
      // Sort by most donations or newest
      result = [...result].sort((a, b) => (b.donations || 0) - (a.donations || 0))
    } else if (activeTab === "saved") {
      // Filter saved projects
      result = result.filter((project) => savedProjectIds.includes(project.id))
    }

    setFilteredProjects(result)
  }, [searchQuery, selectedCategories, urgentOnly, activeTab, projects, savedProjectIds])

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  // Handle save/unsave project
  const handleSaveToggle = (projectId: string, isSaved: boolean) => {
    if (isSaved) {
      setSavedProjectIds((prev) => [...prev, projectId])
    } else {
      setSavedProjectIds((prev) => prev.filter((id) => id !== projectId))
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Donor Dashboard</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search for projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <div className="w-full md:w-64 flex-shrink-0">
            {/* Categories */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Categories</h3>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => toggleCategory(category)}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Urgency</h3>
              <div className="flex items-center">
                <Checkbox
                  id="urgent-only"
                  checked={urgentOnly}
                  onCheckedChange={(checked) => setUrgentOnly(checked as boolean)}
                />
                <label htmlFor="urgent-only" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Urgent projects only
                </label>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Project Tabs */}
            <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant={activeTab === "all" ? "default" : "ghost"}
                className="rounded-none border-b-2 border-transparent px-1 py-2"
                onClick={() => setActiveTab("all")}
              >
                All Projects
              </Button>
              <Button
                variant={activeTab === "trending" ? "default" : "ghost"}
                className="rounded-none border-b-2 border-transparent px-1 py-2 flex items-center gap-2"
                onClick={() => setActiveTab("trending")}
              >
                <TrendingUp className="h-4 w-4" />
                Trending
              </Button>
              <Button
                variant={activeTab === "saved" ? "default" : "ghost"}
                className="rounded-none border-b-2 border-transparent px-1 py-2 flex items-center gap-2"
                onClick={() => setActiveTab("saved")}
              >
                <Bookmark className="h-4 w-4" />
                Saved
              </Button>
            </div>

            {/* Projects Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">
                  No projects match your current filters. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isDonorView={true}
                    isSaved={savedProjectIds.includes(project.id)}
                    onSaveToggle={handleSaveToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
