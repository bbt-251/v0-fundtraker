"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { getProjectById } from "@/services/project-service"
import type { Project } from "@/types/project"
import { LoadingAnimation } from "@/components/loading-animation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar, MapPin, Tag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
// Add getUserProfile import at the top of the file
import { getUserProfile } from "@/services/user-service"
// Import the ProjectDonations component at the top of the file
import { ProjectDonations } from "@/components/project-donations"
import GanttChart from "@/components/ui/ganttChart"
import { RiskMatrixTab } from "@/components/risk-matrix-tab"
// Import useAuth hook
import { useAuth } from "@/contexts/auth-context"

export default function ProjectDetailsPage() {
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [activeResourceTab, setActiveResourceTab] = useState("human")
  const [activePlanningTab, setActivePlanningTab] = useState("activities")
  const [activeCommunicationTab, setActiveCommunicationTab] = useState("plan")
  // Add owner state in the component
  const [owner, setOwner] = useState<{ name: string; email: string | null } | null>(null)
  const [activeRiskTab, setActiveRiskTab] = useState("list")
  // Get user profile from auth context
  const { userProfile } = useAuth()

  useEffect(() => {
    // Modify the fetchProject function inside useEffect to also fetch the owner's information
    async function fetchProject() {
      try {
        setLoading(true)
        const projectData = await getProjectById(id as string)
        setProject(projectData)

        // Fetch owner information if ownerId exists
        if (projectData?.ownerId) {
          const ownerProfile = await getUserProfile(projectData.ownerId)
          if (ownerProfile) {
            setOwner({
              name: `${ownerProfile.firstName || ""} ${ownerProfile.lastName || ""}`.trim() || "Unknown",
              email: ownerProfile.email,
            })
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch project details")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mb-4">{error || "Project not found"}</p>
        <Link href="/donor-dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    )
  }

  // Safe date formatting function
  const safeFormatDate = (dateValue: any) => {
    if (!dateValue) return "N/A"

    try {
      // Handle different date formats
      let date
      if (dateValue instanceof Date) {
        date = dateValue
      } else if (typeof dateValue === "number") {
        date = new Date(dateValue)
      } else if (typeof dateValue === "string") {
        date = new Date(dateValue)
      } else {
        return "Invalid date"
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "Invalid date"
      }

      return date.toLocaleDateString()
    } catch (error) {
      console.error("Error formatting date:", error)
      return "Error formatting date"
    }
  }

  // Calculate total project cost
  const calculateHumanResourceCost = (project: Project) => {
    if (!project.humanResources || project.humanResources.length === 0) return 0
    return project.humanResources.reduce((total, resource) => {
      return total + resource.costPerDay * resource.quantity * 30
    }, 0)
  }

  const calculateMaterialResourceCost = (project: Project) => {
    if (!project.materialResources || project.materialResources.length === 0) return 0
    return project.materialResources.reduce((total, resource) => {
      if (resource.costType === "one-time") {
        return total + resource.costAmount
      } else {
        // For recurring costs, calculate monthly cost
        return total + (resource.costAmount * 30) / resource.amortizationPeriod
      }
    }, 0)
  }

  const calculateTotalProjectCost = (project: Project) => {
    const humanCost = calculateHumanResourceCost(project)
    const materialCost = calculateMaterialResourceCost(project)
    return humanCost + materialCost
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

  // Calculate donation progress
  const totalProjectCost = project.cost || calculateTotalProjectCost(project)
  const progressPercentage =
    totalProjectCost > 0 ? Math.min(100, Math.round(((project.donations || 0) / totalProjectCost) * 100)) : 0

  // Check if user is a donor
  const isDonor = userProfile?.role === "Donor"

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard">
          <Button variant="outline">← Back to Projects</Button>
        </Link>
        {/* Only show Donate Now button for users with Donor role */}
        {isDonor && (
          <Link href={`/donate/${project.id}`}>
            <Button>Donate Now</Button>
          </Link>
        )}
      </div>

      {/* Project Header */}
      <div className="relative mb-8 overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
        <div className="mb-4">
          <h1 className="mb-2 text-3xl font-bold">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              <span>{project.location || "Location not specified"}</span>
            </div>
            <div className="flex items-center">
              <Tag className="mr-1 h-4 w-4" />
              <span>{project.category || "Uncategorized"}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>Created: {safeFormatDate(project.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center mb-1">
              <h3 className="text-sm font-medium">Progress</h3>
              <span className="ml-auto text-sm font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 bg-white/30" indicatorClassName="bg-white" />
            <div className="mt-1 text-sm">
              {formatCurrency(project.donations || 0)} of {formatCurrency(totalProjectCost)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center">
              <span className="text-sm mr-2">Announced to donors:</span>
              <Badge variant={project.isAnnouncedToDonors ? "default" : "outline"} className="bg-white/20 text-white">
                {project.isAnnouncedToDonors ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-2">In execution:</span>
              <Badge variant={project.isInExecution ? "default" : "outline"} className="bg-white/20 text-white">
                {project.isInExecution ? "Yes" : "No"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Content - Project Details */}
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
              <TabsTrigger value="risks">Risks</TabsTrigger>
              <TabsTrigger value="communication">Communication</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="space-y-6">
                <div className="mb-6 overflow-hidden rounded-lg">
                  <Image
                    src={project.imageUrl || "/project-management-team.png"}
                    alt={project.name}
                    width={800}
                    height={400}
                    className="w-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="mb-2 text-xl font-semibold">About This Project</h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{project.description}</p>
                </div>

                <div>
                  <h2 className="mb-2 text-xl font-semibold">Objectives</h2>
                  <div className="text-gray-700 dark:text-gray-300">
                    {Array.isArray(project.objectives) ? (
                      <ul className="list-inside list-disc space-y-1">
                        {project.objectives.map((objective, index) => (
                          <li key={index}>{objective}</li>
                        ))}
                      </ul>
                    ) : typeof project.objectives === "string" ? (
                      <p className="whitespace-pre-line">{project.objectives}</p>
                    ) : (
                      <p>No objectives listed</p>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="mb-2 text-xl font-semibold">Scope</h2>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {project.scope || "No scope defined"}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources" className="mt-6">
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveResourceTab("human")}
                    className={`pb-2 px-1 ${
                      activeResourceTab === "human"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Human Resources
                  </button>
                  <button
                    onClick={() => setActiveResourceTab("material")}
                    className={`pb-2 px-1 ${
                      activeResourceTab === "material"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Material Resources
                  </button>
                  <button
                    onClick={() => setActiveResourceTab("financial")}
                    className={`pb-2 px-1 ${
                      activeResourceTab === "financial"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Financial Resources
                  </button>
                </div>
              </div>

              {/* Human Resources */}
              {activeResourceTab === "human" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Human Resources</h3>
                  {project.humanResources && project.humanResources.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Cost Per Day
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total Monthly Cost
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.humanResources.map((resource) => (
                            <tr key={resource.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {resource.role}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatCurrency(resource.costPerDay)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {resource.quantity}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatCurrency(resource.costPerDay * resource.quantity * 30)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No human resources added yet.</p>
                  )}
                </div>
              )}

              {/* Material Resources */}
              {activeResourceTab === "material" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Material Resources</h3>
                  {project.materialResources && project.materialResources.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Cost Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Cost Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.materialResources.map((resource) => (
                            <tr key={resource.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {resource.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {resource.type}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {resource.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">
                                {resource.costType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatCurrency(resource.costAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No material resources added yet.</p>
                  )}
                </div>
              )}

              {/* Financial Resources */}
              {activeResourceTab === "financial" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Financial Resources</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Human Resource Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(calculateHumanResourceCost(project))}</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Material Resource Cost</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{formatCurrency(calculateMaterialResourceCost(project))}</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Total Project Cost</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalProjectCost)}
                      </p>
                    </CardContent>
                  </Card>

                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-4">Fund Accounts</h4>
                  {project.fundAccounts && project.fundAccounts.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Account Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Account Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Bank Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Account Owner
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.fundAccounts.map((account) => (
                            <tr key={account.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {account.accountName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {account.accountType}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {account.bankName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {account.accountOwnerName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    account.status === "Approved"
                                      ? "success"
                                      : account.status === "Rejected"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {account.status || "Pending"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No fund accounts added yet.</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Planning Tab */}
            <TabsContent value="planning" className="mt-6">
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActivePlanningTab("activities")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "activities"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Activities
                  </button>
                  <button
                    onClick={() => setActivePlanningTab("tasks")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "tasks"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setActivePlanningTab("deliverables")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "deliverables"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Deliverables
                  </button>
                  <button
                    onClick={() => setActivePlanningTab("milestones")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "milestones"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Milestones
                  </button>
                  <button
                    onClick={() => setActivePlanningTab("decisionGates")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "decisionGates"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Decision Gates
                  </button>
                  <button
                    onClick={() => setActivePlanningTab("ganttChart")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "ganttChart"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Gantt Chart
                  </button>
                </div>
              </div>

              {/* Decision Gates */}
              {activePlanningTab === "decisionGates" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Decision Gates</h3>
                  {project.decisionGates && project.decisionGates.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Approval Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.decisionGates.map((gate) => (
                            <tr key={gate.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {gate.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {gate.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    gate.status === "Approved"
                                      ? "success"
                                      : gate.status === "Rejected"
                                        ? "destructive"
                                        : "outline"
                                  }
                                >
                                  {gate.status || "Pending"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(gate.approvalDate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No decision gates added yet.</p>
                  )}
                </div>
              )}

              {/* Activities */}
              {activePlanningTab === "activities" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activities</h3>
                  {project.activities && project.activities.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.activities.map((activity) => (
                            <tr key={activity.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {activity.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {activity.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(activity.startDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(activity.endDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    activity.status === "Completed"
                                      ? "success"
                                      : activity.status === "In Progress"
                                        ? "secondary"
                                        : activity.status === "Delayed"
                                          ? "destructive"
                                          : "outline"
                                  }
                                >
                                  {activity.status || "Planned"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No activities added yet.</p>
                  )}
                </div>
              )}

              {/* Tasks */}
              {activePlanningTab === "tasks" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tasks</h3>
                  {project.tasks && project.tasks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              End Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.tasks.map((task) => (
                            <tr key={task.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {task.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {task.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(task.startDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(task.endDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    task.status === "Completed"
                                      ? "success"
                                      : task.status === "In Progress"
                                        ? "secondary"
                                        : task.status === "Delayed"
                                          ? "destructive"
                                          : "outline"
                                  }
                                >
                                  {task.status || "Planned"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No tasks added yet.</p>
                  )}
                </div>
              )}

              {/* Deliverables */}
              {activePlanningTab === "deliverables" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deliverables</h3>
                  {project.deliverables && project.deliverables.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.deliverables.map((deliverable) => (
                            <tr key={deliverable.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {deliverable.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {deliverable.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(deliverable.dueDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    deliverable.status === "Completed"
                                      ? "success"
                                      : deliverable.status === "In Progress"
                                        ? "secondary"
                                        : deliverable.status === "Delayed"
                                          ? "destructive"
                                          : "outline"
                                  }
                                >
                                  {deliverable.status || "Planned"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No deliverables added yet.</p>
                  )}
                </div>
              )}

              {/* Milestones */}
              {activePlanningTab === "milestones" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Milestones</h3>
                  {project.milestones && project.milestones.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.milestones.map((milestone) => (
                            <tr key={milestone.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {milestone.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {milestone.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(milestone.dueDate)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <Badge
                                  variant={
                                    milestone.status === "Completed"
                                      ? "success"
                                      : milestone.status === "In Progress"
                                        ? "secondary"
                                        : milestone.status === "Delayed"
                                          ? "destructive"
                                          : "outline"
                                  }
                                >
                                  {milestone.status || "Planned"}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No milestones added yet.</p>
                  )}
                </div>
              )}

              {/* Gantt Chart */}
              {activePlanningTab === "ganttChart" && (
                <div>
                  <GanttChart
                    tasks={project.tasks}
                    activities={project.activities}
                    deliverables={project.deliverables}
                    decisionGates={project?.decisionGates ?? []}
                    chartLoading={false}
                    onElementClick={undefined}
                  />
                </div>
              )}
            </TabsContent>

            {/* Risks Tab */}
            <TabsContent value="risks" className="mt-6">
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveRiskTab("list")}
                    className={`pb-2 px-1 ${
                      activeRiskTab === "list"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Risk List
                  </button>
                  <button
                    onClick={() => setActiveRiskTab("matrix")}
                    className={`pb-2 px-1 ${
                      activeRiskTab === "matrix"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Risk Matrix
                  </button>
                </div>
              </div>

              {/* Risk List */}
              {activeRiskTab === "list" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Risks</h3>
                  {project.risks && project.risks.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Probability
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Impact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Mitigation Plan
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.risks.map((risk) => (
                            <tr key={risk.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {risk.name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {risk.description}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {risk.probability}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {risk.impact}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {risk.mitigationPlan}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No risks added yet.</p>
                  )}
                </div>
              )}

              {/* Risk Matrix */}
              {activeRiskTab === "matrix" && <RiskMatrixTab projectId={project.id} risks={project.risks || []} />}
            </TabsContent>

            {/* Communication Tab */}
            <TabsContent value="communication" className="mt-6">
              <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveCommunicationTab("plan")}
                    className={`pb-2 px-1 ${
                      activeCommunicationTab === "plan"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Communication Plan
                  </button>
                  <button
                    onClick={() => setActiveCommunicationTab("log")}
                    className={`pb-2 px-1 ${
                      activeCommunicationTab === "log"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Communication Log
                  </button>
                </div>
              </div>

              {/* Communication Plan */}
              {activeCommunicationTab === "plan" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Communication Plan</h3>
                  {project.communicationPlan ? (
                    <div className="space-y-4">
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Objective:</strong> {project.communicationPlan.objective}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Target Audience:</strong> {project.communicationPlan.targetAudience}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Key Messages:</strong> {project.communicationPlan.keyMessages}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Communication Channels:</strong> {project.communicationPlan.communicationChannels}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Frequency:</strong> {project.communicationPlan.frequency}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Responsibility:</strong> {project.communicationPlan.responsibility}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No communication plan added yet.</p>
                  )}
                </div>
              )}

              {/* Communication Log */}
              {activeCommunicationTab === "log" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Communication Log</h3>
                  {project.communicationLog && project.communicationLog.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Channel
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Audience
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Summary
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.communicationLog.map((log) => (
                            <tr key={log.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {safeFormatDate(log.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {log.channel}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {log.audience}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {log.subject}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {log.summary}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No communication logs added yet.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Content - Project Donations */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Project Owner</CardTitle>
              <CardDescription>Contact information of the project owner.</CardDescription>
            </CardHeader>
            <CardContent>
              {owner ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{owner.name}</p>
                  <p className="text-sm text-muted-foreground">{owner.email || "No email available"}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Owner information not available.</p>
              )}
            </CardContent>
          </Card>
          <ProjectDonations projectId={project.id} />
        </div>
      </div>
    </div>
  )
}
