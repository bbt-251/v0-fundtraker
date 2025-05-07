"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowUp, ArrowDown } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { formatCurrency } from "@/lib/utils/currency-utils"
import { formatDate } from "@/lib/utils/date-utils"
import type { HumanResource, MaterialResource } from "@/types/project"
import type { Donation } from "@/types/donation"

interface ProjectFundStatus {
  id: string
  name: string
  totalRaised: number
  target: number
  progress: number
  donors: number
  lastDonation: any // Firestore timestamp
}

interface ProjectFundStatusProps {
  className?: string
}

export default function ProjectFundStatus({ className }: ProjectFundStatusProps) {
  const [projects, setProjects] = useState<ProjectFundStatus[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectFundStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [progressRange, setProgressRange] = useState([0, 100])
  const [sortField, setSortField] = useState<keyof ProjectFundStatus>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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

  useEffect(() => {
    const fetchProjectsAndDonations = async () => {
      try {
        setIsLoading(true)

        // Fetch all projects
        const projectsRef = collection(db, "projects")
        const projectsSnapshot = await getDocs(projectsRef)

        // Fetch all donations
        const donationsRef = collection(db, "donations")
        const donationsSnapshot = await getDocs(donationsRef)

        // Group donations by project ID
        const donationsByProject: Record<string, Donation[]> = {}
        donationsSnapshot.forEach((doc) => {
          const donation = { id: doc.id, ...doc.data() } as Donation
          if (donation.projectId) {
            if (!donationsByProject[donation.projectId]) {
              donationsByProject[donation.projectId] = []
            }
            donationsByProject[donation.projectId].push(donation)
          }
        })

        const projectsData: ProjectFundStatus[] = []

        projectsSnapshot.forEach((doc) => {
          const data = doc.data()
          const projectId = doc.id

          // Get donations for this project
          const projectDonations = donationsByProject[projectId] || []

          // Calculate total raised - sum of all completed donation amounts
          const totalRaised = projectDonations
            .filter((donation) => donation.status === "completed")
            .reduce((sum, donation) => sum + donation.amount, 0)

          // Calculate total project cost (target) - sum of human and material resources
          let totalCost = 0

          // Add human resource costs using the provided calculation
          if (data.humanResources && Array.isArray(data.humanResources)) {
            totalCost += calculateHumanResourceCost(data.humanResources as HumanResource[])
          }

          // Add material resource costs using the provided calculation
          if (data.materialResources && Array.isArray(data.materialResources)) {
            totalCost += calculateMaterialResourceCost(data.materialResources as MaterialResource[])
          }

          // If there's a fundingGoal and no resources, use that as the target
          if (totalCost === 0 && data.fundingGoal) {
            totalCost = data.fundingGoal
          }

          // Calculate unique donors - count all anonymous as one
          const uniqueDonorIds = new Set()
          let hasAnonymousDonation = false

          projectDonations
            .filter((donation) => donation.status === "completed")
            .forEach((donation) => {
              if (donation.isAnonymous) {
                hasAnonymousDonation = true
              } else if (donation.userId) {
                uniqueDonorIds.add(donation.userId)
              }
            })

          const donorsCount = uniqueDonorIds.size + (hasAnonymousDonation ? 1 : 0)

          // Find the latest donation
          let lastDonation = null
          if (projectDonations.length > 0) {
            const completedDonations = projectDonations.filter((donation) => donation.status === "completed")
            if (completedDonations.length > 0) {
              lastDonation = completedDonations.reduce((latest, donation) => {
                if (!latest.timestamp) return donation
                if (!donation.timestamp) return latest
                return donation.timestamp.toDate() > latest.timestamp.toDate() ? donation : latest
              }).timestamp
            }
          }

          // Calculate progress percentage
          const progress = totalCost > 0 ? Math.min(100, Math.round((totalRaised / totalCost) * 100)) : 0

          projectsData.push({
            id: projectId,
            name: data.name || "Unnamed Project",
            totalRaised,
            target: totalCost,
            progress,
            donors: donorsCount,
            lastDonation,
          })
        })

        console.log("Projects data:", projectsData)
        setProjects(projectsData)
        setFilteredProjects(projectsData)
      } catch (error) {
        console.error("Error fetching projects and donations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjectsAndDonations()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...projects]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter((project) => project.name.toLowerCase().includes(query))
    }

    // Apply progress range filter
    result = result.filter((project) => project.progress >= progressRange[0] && project.progress <= progressRange[1])

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === "lastDonation") {
        // Handle date comparison
        const dateA = a.lastDonation ? a.lastDonation.toDate().getTime() : 0
        const dateB = b.lastDonation ? b.lastDonation.toDate().getTime() : 0
        comparison = dateA - dateB
      } else {
        // Handle numeric fields
        comparison = (a[sortField] as number) - (b[sortField] as number)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredProjects(result)
  }, [projects, searchQuery, progressRange, sortField, sortDirection])

  const handleSort = (field: keyof ProjectFundStatus) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new field and default to ascending
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const resetFilters = () => {
    setSearchQuery("")
    setProgressRange([0, 100])
    setSortField("name")
    setSortDirection("asc")
  }

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Project Fund Status</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="relative w-full md:w-auto flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-col w-full md:w-64 gap-1">
                <span className="text-sm">
                  Progress: {progressRange[0]}% - {progressRange[1]}%
                </span>
                <Slider
                  defaultValue={[0, 100]}
                  min={0}
                  max={100}
                  step={1}
                  value={progressRange}
                  onValueChange={setProgressRange}
                  className="w-full"
                />
              </div>

              <div className="flex gap-2">
                <div className="w-40">
                  <Button variant="outline" className="w-full justify-between" onClick={() => handleSort("name")}>
                    {sortField === "name" ? (
                      <>
                        Project Name{" "}
                        {sortDirection === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </>
                    ) : (
                      <>Project Name</>
                    )}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection("asc")}
                  className={sortDirection === "asc" ? "bg-blue-100" : ""}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection("desc")}
                  className={sortDirection === "desc" ? "bg-blue-100" : ""}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("name")}
                  >
                    Project Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("totalRaised")}
                  >
                    Total Raised {sortField === "totalRaised" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("target")}
                  >
                    Target {sortField === "target" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("progress")}
                  >
                    Progress {sortField === "progress" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("donors")}
                  >
                    Donors {sortField === "donors" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("lastDonation")}
                  >
                    Last Donation {sortField === "lastDonation" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center">
                      Loading projects...
                    </td>
                  </tr>
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b">
                      <td className="py-3">{project.name}</td>
                      <td className="py-3">{formatCurrency(project.totalRaised)}</td>
                      <td className="py-3">{formatCurrency(project.target)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <span>{project.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3">{project.donors}</td>
                      <td className="py-3">{project.lastDonation ? formatDate(project.lastDonation) : "N/A"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No projects match your filter criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
