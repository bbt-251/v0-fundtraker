"use client"

import { useState, useEffect } from "react"
import { getProjectById } from "@/services/project-service"
import type { Project } from "@/types/project"
import { X, Calendar, MapPin, Tag, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LoadingAnimation } from "@/components/loading-animation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ProjectModalProps {
  projectId: string
  onClose: () => void
}

export function ProjectModal({ projectId, onClose }: ProjectModalProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("definition")
  const [activeResourceTab, setActiveResourceTab] = useState("human")
  const [activePlanningTab, setActivePlanningTab] = useState("activities")
  const [activeCommunicationTab, setActiveCommunicationTab] = useState("plan")

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const fetchedProject = await getProjectById(projectId)
        setProject(fetchedProject)
      } catch (error: any) {
        setError(error.message || "Failed to fetch project details")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate donation progress
  const calculateDonationProgress = (project: Project) => {
    const totalCost = calculateTotalProjectCost(project)
    if (totalCost === 0) return 0
    return Math.min(100, Math.round(((project.donations || 0) / totalCost) * 100))
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <LoadingAnimation />
          <p className="text-center mt-4 text-gray-600 dark:text-gray-300">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Error</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Not Found</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The requested project could not be found.</p>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    )
  }

  const totalProjectCost = calculateTotalProjectCost(project)
  const donationProgress = calculateDonationProgress(project)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black bg-opacity-30 rounded-full p-1 text-white hover:bg-opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-6">
            <h2 className="text-2xl font-bold text-white">{project.name}</h2>
            <div className="flex items-center text-white mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{project.location || "Location not specified"}</span>
              <span className="mx-2">•</span>
              <Tag className="h-4 w-4 mr-1" />
              <span>{project.category || "Uncategorized"}</span>
              <span className="mx-2">•</span>
              <Calendar className="h-4 w-4 mr-1" />
              <span>Created: {safeFormatDate(project.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</h3>
                <span className="ml-auto text-sm font-medium text-gray-900 dark:text-white">{donationProgress}%</span>
              </div>
              <Progress value={donationProgress} className="h-2" />
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {formatCurrency(project.donations || 0)} of {formatCurrency(totalProjectCost)}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex items-center">
                <span className="text-sm mr-2">Announced to donors:</span>
                <Badge variant={project.isAnnouncedToDonors ? "default" : "outline"}>
                  {project.isAnnouncedToDonors ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center">
                <span className="text-sm mr-2">In execution:</span>
                <Badge variant={project.isInExecution ? "default" : "outline"}>
                  {project.isInExecution ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Approval Status Alert */}
          {project.isAnnouncedToDonors && (
            <div className="mt-4">
              {project.approvalStatus === "pending" && (
                <Alert variant="warning">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Awaiting Approval</AlertTitle>
                  <AlertDescription>
                    This project has been announced to donors but is awaiting approval from a platform governor. Donors
                    will not be able to see this project until it is approved.
                  </AlertDescription>
                </Alert>
              )}
              {project.approvalStatus === "approved" && (
                <Alert variant="success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Project Approved</AlertTitle>
                  <AlertDescription>
                    This project has been approved by a platform governor and is now visible to donors.
                  </AlertDescription>
                </Alert>
              )}
              {project.approvalStatus === "rejected" && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertTitle>Project Rejected</AlertTitle>
                  <AlertDescription>
                    This project announcement has been rejected by a platform governor.
                    {project.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 rounded-md">
                        <strong>Reason:</strong> {project.rejectionReason}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
              <TabsTrigger
                value="definition"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent px-4"
              >
                Definition
              </TabsTrigger>
              <TabsTrigger
                value="resources"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent px-4"
              >
                Resources
              </TabsTrigger>
              <TabsTrigger
                value="planning"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent px-4"
              >
                Planning
              </TabsTrigger>
              <TabsTrigger
                value="risks"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent px-4"
              >
                Risks
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                className="data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none border-b-2 border-transparent px-4"
              >
                Communication
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 16rem)" }}>
            {/* Project Definition */}
            <TabsContent value="definition" className="mt-0">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {project.description || "No description provided."}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Objectives</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {project.objectives || "No objectives specified."}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Scope</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                    {project.scope || "No scope specified."}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Documents</h3>
                  {project.documents && project.documents.length > 0 ? (
                    <div className="space-y-4">
                      {/* Group documents by type */}
                      {["business", "tax", "additional"].map((type) => {
                        const docs = project.documents.filter((doc) => doc.type === type)
                        if (docs.length === 0) return null

                        return (
                          <div key={type}>
                            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2 capitalize">
                              {type} Documents
                            </h4>
                            <ul className="space-y-2">
                              {docs.map((doc) => (
                                <li
                                  key={doc.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                                >
                                  <span className="text-sm text-gray-700 dark:text-gray-300">{doc.name}</span>
                                  <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                  >
                                    Download
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No documents available.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Project Resources */}
            <TabsContent value="resources" className="mt-0">
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
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Cost Per Day
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Quantity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {project.humanResources.map((resource) => (
                            <tr key={resource.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {resource.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {resource.role}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {resource.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {formatCurrency(resource.costPerDay)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {resource.quantity}
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

            {/* Project Planning */}
            <TabsContent value="planning" className="mt-0">
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
                    onClick={() => setActivePlanningTab("gantt")}
                    className={`pb-2 px-1 ${
                      activePlanningTab === "gantt"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Gantt Chart
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
                </div>
              </div>

              {/* Activities */}
              {activePlanningTab === "activities" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activities</h3>
                  {project.activities && project.activities.length > 0 ? (
                    <div className="space-y-4">
                      {project.activities.map((activity) => (
                        <Card key={activity.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle>{activity.name}</CardTitle>
                              <Badge
                                variant={
                                  activity.status === "Completed"
                                    ? "success"
                                    : activity.status === "In Progress"
                                      ? "default"
                                      : activity.status === "Delayed"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {activity.status}
                              </Badge>
                            </div>
                            <CardDescription>
                              {safeFormatDate(activity.startDate)} - {safeFormatDate(activity.endDate)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300">{activity.description}</p>
                          </CardContent>
                        </Card>
                      ))}
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
                    <div className="space-y-4">
                      {project.tasks.map((task) => {
                        // Find the parent activity
                        const parentActivity = project.activities?.find((a) => a.id === task.activityId)

                        return (
                          <Card key={task.id}>
                            <CardHeader className="pb-2">
                              <CardTitle>{task.name}</CardTitle>
                              <CardDescription>Part of: {parentActivity?.name || "Unknown Activity"}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-700 dark:text-gray-300 mb-2">{task.description}</p>
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Start Date:</span> {safeFormatDate(task.startDate)}
                                </div>
                                <div>
                                  <span className="font-medium">End Date:</span> {safeFormatDate(task.endDate)}
                                </div>
                                <div>
                                  <span className="font-medium">Duration:</span> {task.duration} days
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
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
                    <div className="space-y-4">
                      {project.deliverables.map((deliverable) => (
                        <Card key={deliverable.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle>{deliverable.name}</CardTitle>
                              <Badge
                                variant={
                                  deliverable.status === "Completed"
                                    ? "success"
                                    : deliverable.status === "In Progress"
                                      ? "default"
                                      : deliverable.status === "Delayed"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {deliverable.status}
                              </Badge>
                            </div>
                            <CardDescription>Deadline: {safeFormatDate(deliverable.deadline)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">{deliverable.description}</p>

                            {deliverable.successCriteria && deliverable.successCriteria.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Success Criteria:</h4>
                                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                                  {deliverable.successCriteria.map((criteria) => (
                                    <li key={criteria.id}>{criteria.description}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
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
                    <div className="space-y-4">
                      {project.milestones.map((milestone) => (
                        <Card key={milestone.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle>{milestone.name}</CardTitle>
                              <Badge
                                variant={
                                  milestone.status === "Completed"
                                    ? "success"
                                    : milestone.status === "In Progress"
                                      ? "default"
                                      : milestone.status === "Delayed"
                                        ? "destructive"
                                        : "outline"
                                }
                              >
                                {milestone.status}
                              </Badge>
                            </div>
                            <CardDescription>Date: {safeFormatDate(milestone.date)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300">{milestone.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No milestones added yet.</p>
                  )}
                </div>
              )}

              {/* Gantt Chart */}
              {activePlanningTab === "gantt" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gantt Chart</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    The Gantt chart visualization is available in the full project view.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      Gantt chart preview not available in modal view
                    </p>
                  </div>
                </div>
              )}

              {/* Decision Gates */}
              {activePlanningTab === "decisionGates" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Decision Gates</h3>
                  {project.decisionGates && project.decisionGates.length > 0 ? (
                    <div className="space-y-4">
                      {project.decisionGates.map((gate) => (
                        <Card key={gate.id}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between">
                              <CardTitle>{gate.name}</CardTitle>
                              <Badge
                                variant={
                                  gate.status === "Completed"
                                    ? "success"
                                    : gate.status === "Scheduled"
                                      ? "default"
                                      : "destructive"
                                }
                              >
                                {gate.status}
                              </Badge>
                            </div>
                            <CardDescription>Date: {safeFormatDate(gate.dateTime)}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">{gate.objective}</p>

                            {gate.participants && gate.participants.length > 0 && (
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Participants:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {gate.participants.map((participant) => (
                                    <Badge key={participant.id} variant="outline">
                                      {participant.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {gate.videoConferenceLink && (
                              <div className="mt-3">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-1">Meeting Link:</h4>
                                <a
                                  href={gate.videoConferenceLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  {gate.videoConferenceLink}
                                </a>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No decision gates added yet.</p>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Project Risks */}
            <TabsContent value="risks" className="mt-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Risks</h3>
              {project.risks && project.risks.length > 0 ? (
                <div className="space-y-4">
                  {project.risks.map((risk) => (
                    <Card key={risk.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle>{risk.name}</CardTitle>
                          <Badge
                            variant={
                              risk.status === "Mitigated"
                                ? "success"
                                : risk.status === "Active"
                                  ? "destructive"
                                  : risk.status === "Accepted"
                                    ? "warning"
                                    : "outline"
                            }
                          >
                            {risk.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{risk.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Impact</h4>
                            <div className="flex items-center mt-1">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${(risk.impact / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm font-medium">{risk.impact}/5</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Probability</h4>
                            <div className="flex items-center mt-1">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${(risk.probability / 5) * 100}%` }}
                                ></div>
                              </div>
                              <span className="ml-2 text-sm font-medium">{risk.probability}/5</span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Score</h4>
                          <div className="mt-1">
                            <Badge
                              variant={risk.riskScore > 15 ? "destructive" : risk.riskScore > 8 ? "warning" : "default"}
                            >
                              {risk.riskScore} / 25
                            </Badge>
                          </div>
                        </div>

                        {risk.mitigationActions && risk.mitigationActions.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Mitigation Actions:</h4>
                            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                              {risk.mitigationActions.map((action) => (
                                <li key={action.id}>{action.description}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No risks added yet.</p>
              )}
            </TabsContent>

            {/* Project Communication */}
            <TabsContent value="communication" className="mt-0">
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
                    onClick={() => setActiveCommunicationTab("social")}
                    className={`pb-2 px-1 ${
                      activeCommunicationTab === "social"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Social Media
                  </button>
                  <button
                    onClick={() => setActiveCommunicationTab("other")}
                    className={`pb-2 px-1 ${
                      activeCommunicationTab === "other"
                        ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Other Mediums
                  </button>
                </div>
              </div>

              {/* Communication Plan */}
              {activeCommunicationTab === "plan" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Communication Plan</h3>
                  {project.communicationPlan ? (
                    <div className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>Stakeholder Strategy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {project.communicationPlan.stakeholderStrategy || "No strategy defined."}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Meeting Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {project.communicationPlan.meetingSchedule || "No schedule defined."}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Reporting Frequency</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {project.communicationPlan.reportingFrequency || "No frequency defined."}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Feedback Mechanisms</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {project.communicationPlan.feedbackMechanisms || "No mechanisms defined."}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Emergency Contacts</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {project.communicationPlan.emergencyContacts || "No contacts defined."}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No communication plan defined yet.</p>
                  )}
                </div>
              )}

              {/* Social Media */}
              {activeCommunicationTab === "social" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Media Accounts</h3>
                  {project.socialMediaAccounts && project.socialMediaAccounts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {project.socialMediaAccounts.map((account) => (
                        <Card key={account.id}>
                          <CardHeader className="pb-2">
                            <CardTitle>{account.platform}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                              <span className="font-medium">Username:</span> {account.username}
                            </p>
                            {account.url && (
                              <a
                                href={account.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Visit Profile
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No social media accounts added yet.</p>
                  )}
                </div>
              )}

              {/* Other Mediums */}
              {activeCommunicationTab === "other" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Other Communication Mediums
                  </h3>
                  {project.communicationMediums && project.communicationMediums.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {project.communicationMediums.map((medium) => (
                        <Card key={medium.id}>
                          <CardContent className="p-4">
                            <p className="text-gray-700 dark:text-gray-300">{medium.medium}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">No other communication mediums added yet.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <Button onClick={onClose} variant="outline" className="mr-2">
            Close
          </Button>
          <Button asChild>
            <a href={`/editProject?id=${project.id}`}>Edit Project</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
