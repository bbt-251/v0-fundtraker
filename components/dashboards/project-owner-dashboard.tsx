"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Loader2, DollarSign, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils/currency-utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitFundReleaseRequest, getFundReleaseRequests, getProjects } from "@/services/project-service"
import type { Project, FundReleaseRequest } from "@/types/project"
import type { MilestoneBudget } from "@/components/financial-resource-tab"
import type { HumanResource, MaterialResource } from "@/types/project"

export default function ProjectOwnerDashboard() {
  const { userProfile, user } = useAuth()
  const [greeting, setGreeting] = useState("Good day")
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [milestoneBudgets, setMilestoneBudgets] = useState<MilestoneBudget[]>([])
  const [fundReleaseRequests, setFundReleaseRequests] = useState<FundReleaseRequest[]>([])
  const [requestingFunds, setRequestingFunds] = useState<string | null>(null)
  const [selectedMilestoneBudget, setSelectedMilestoneBudget] = useState<MilestoneBudget | null>(null)
  const [releaseDescription, setReleaseDescription] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [humanResources, setHumanResources] = useState<HumanResource[]>([])
  const [materialResources, setMaterialResources] = useState<MaterialResource[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalDonations: 0,
    pendingApprovals: 0,
  })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  useEffect(() => {
    async function fetchUserProjects() {
      if (!user?.uid) return

      try {
        setLoading(true)

        // Fetch projects where the user is the owner
        const projectsData = await getProjects(user.uid)

        setProjects(projectsData)

        // Calculate dashboard stats
        const activeProjects = projectsData.filter((p) => p.isInExecution).length
        const totalDonations = projectsData.reduce((sum, p) => sum + (p.donations || 0), 0)
        const pendingApprovals = projectsData.filter((p) => p.approvalStatus === "pending").length

        setStats({
          totalProjects: projectsData.length,
          activeProjects,
          totalDonations,
          pendingApprovals,
        })

        if (projectsData.length > 0) {
          setSelectedProject(projectsData[0])
          setHumanResources(projectsData[0].humanResources || [])
          setMaterialResources(projectsData[0].materialResources || [])

          // Get milestone budgets for this project
          if (projectsData[0].milestoneBudgets && projectsData[0].milestoneBudgets.length > 0) {
            setMilestoneBudgets(projectsData[0].milestoneBudgets)
          } else {
            // If no milestone budgets found, try to create them from milestones
            const milestones = projectsData[0].milestones || []
            const convertedBudgets = milestones.map((milestone) => ({
              id: milestone.id,
              milestoneId: milestone.id,
              milestoneName: milestone.name,
              budget: milestone.budget || 0,
              percentOfTotal: milestone.percentOfTotal || 0,
              status: "Pending",
              dueDate: milestone.date,
              description: milestone.description || "",
              createdAt: milestone.createdAt || new Date().toISOString(),
            }))
            setMilestoneBudgets(convertedBudgets)
          }

          // Fetch fund release requests for this project
          if (projectsData[0].id) {
            const requests = await getFundReleaseRequests(projectsData[0].id)
            setFundReleaseRequests(requests)
          }
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserProjects()
  }, [user?.uid])

  // Handle project selection change
  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    const project = projects.find((p) => p.id === projectId)

    if (project) {
      setSelectedProject(project)
      setHumanResources(project.humanResources || [])
      setMaterialResources(project.materialResources || [])

      // Get milestone budgets for this project
      if (project.milestoneBudgets && project.milestoneBudgets.length > 0) {
        setMilestoneBudgets(project.milestoneBudgets)
      } else {
        // If no milestone budgets found, try to create them from milestones
        const milestones = project.milestones || []
        const convertedBudgets = milestones.map((milestone) => ({
          id: milestone.id,
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          budget: milestone.budget || 0,
          percentOfTotal: milestone.percentOfTotal || 0,
          status: "Pending",
          dueDate: milestone.date,
          description: milestone.description || "",
          createdAt: milestone.createdAt || new Date().toISOString(),
        }))
        setMilestoneBudgets(convertedBudgets)
      }

      // Fetch fund release requests for this project
      if (project.id) {
        try {
          const requests = await getFundReleaseRequests(project.id)
          setFundReleaseRequests(requests)
        } catch (error) {
          console.error("Error fetching fund release requests:", error)
          setFundReleaseRequests([])
        }
      }
    }
  }

  // Calculate total budget and percentage
  const totalBudget = milestoneBudgets.reduce((sum, budget) => sum + (budget.budget || 0), 0)
  const totalPercentage = milestoneBudgets.reduce((sum, budget) => sum + (budget.percentOfTotal || 0), 0)

  // Sample data for Gantt chart
  const ganttData = [
    { task: "Research", start: 0, duration: 20, complete: 100 },
    { task: "Design", start: 15, duration: 25, complete: 75 },
    { task: "Development", start: 35, duration: 35, complete: 40 },
    { task: "Testing", start: 65, duration: 20, complete: 0 },
    { task: "Deployment", start: 85, duration: 15, complete: 0 },
  ]

  // Sample data for resource utilization
  const resourceData = [
    { name: "Development", allocated: 65, actual: 70 },
    { name: "Design", allocated: 20, actual: 15 },
    { name: "QA", allocated: 10, actual: 8 },
    { name: "Management", allocated: 5, actual: 7 },
  ]

  const handleFundReleaseRequest = async (milestoneBudget: MilestoneBudget) => {
    setSelectedMilestoneBudget(milestoneBudget)
    setReleaseDescription("")
    setDialogOpen(true)
  }

  const submitRequest = async () => {
    if (!selectedMilestoneBudget || !selectedProject || !user) return

    try {
      setRequestingFunds(selectedMilestoneBudget.id)
      setDialogOpen(false)

      // Submit the fund release request to Firebase
      await submitFundReleaseRequest(
        selectedProject.id,
        selectedMilestoneBudget.milestoneId,
        selectedMilestoneBudget.budget || 0,
        releaseDescription,
      )

      // Refresh the fund release requests
      const updatedRequests = await getFundReleaseRequests(selectedProject.id)
      setFundReleaseRequests(updatedRequests)

      toast({
        title: "Fund release request submitted",
        description: `Your request for ${formatCurrency(selectedMilestoneBudget.budget || 0)} has been sent to the Fund Custodian for approval.`,
      })
    } catch (error) {
      console.error("Error submitting fund release request:", error)
      toast({
        title: "Error",
        description: "Failed to submit fund release request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRequestingFunds(null)
    }
  }

  // Check if a milestone already has a pending or approved fund release request
  const hasFundReleaseRequest = (milestoneId: string) => {
    return fundReleaseRequests.some(
      (request) =>
        request.milestoneId === milestoneId && (request.status === "Pending" || request.status === "Approved"),
    )
  }

  // Get the status of a fund release request for a milestone
  const getFundReleaseRequestStatus = (milestoneId: string) => {
    const request = fundReleaseRequests.find((request) => request.milestoneId === milestoneId)
    return request ? request.status : null
  }

  // Calculate total costs
  const calculateHumanResourceCost = (resource: HumanResource) => {
    return resource.costPerDay * resource.quantity * 30 // Assuming 30 days as default
  }

  const calculateMaterialResourceCost = (resource: MaterialResource) => {
    // For one-time costs, just return the amount
    if (resource.costType === "one-time") {
      return resource.costAmount
    }
    // For recurring costs, calculate based on amortization period (assuming 30 days as default)
    return (resource.costAmount * 30) / resource.amortizationPeriod
  }

  const calculateHumanResourceTotal = () => {
    return humanResources.reduce((total, resource) => {
      return total + calculateHumanResourceCost(resource)
    }, 0)
  }

  const calculateMaterialResourceTotal = () => {
    return materialResources.reduce((total, resource) => {
      return total + calculateMaterialResourceCost(resource)
    }, 0)
  }

  const humanResourceTotal = calculateHumanResourceTotal()
  const materialResourceTotal = calculateMaterialResourceTotal()
  const totalCost = humanResourceTotal + materialResourceTotal || 1 // Prevent division by zero

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  // Calculate total milestone budget
  const totalMilestoneBudget = milestoneBudgets.reduce((total, budget) => total + budget.budget, 0)

  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}, {userProfile?.firstName || userProfile?.displayName || "Project Owner"}!
          </h1>
          <p className="text-muted-foreground">Track your projects, funds, and activities in one place.</p>
        </div>

        {/* Dashboard summary cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">{stats.activeProjects} active projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalDonations)}</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{humanResources.length}</div>
              <p className="text-xs text-muted-foreground">Across all projects</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Projects awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Project Selector */}
        <div className="w-full max-w-md">
          <Label htmlFor="project-select">Select Project</Label>
          <select
            id="project-select"
            className="w-full p-2 border rounded-md mt-1"
            value={selectedProject?.id || ""}
            onChange={handleProjectChange}
          >
            <option value="" disabled>
              Select a project
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Timeline */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
              <CardDescription>Gantt chart representation of project schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {/* Simple Gantt chart visualization */}
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <div className="h-[220px] space-y-6">
                  {ganttData.map((item, index) => (
                    <div key={index} className="relative h-8">
                      <div className="absolute left-0 top-0 flex items-center h-full">
                        <span className="text-sm font-medium">{item.task}</span>
                      </div>
                      <div
                        className="absolute h-6 bg-muted rounded-sm"
                        style={{
                          left: `${item.start}%`,
                          width: `${item.duration}%`,
                          top: "4px",
                        }}
                      >
                        <div className="h-full bg-primary rounded-sm" style={{ width: `${item.complete}%` }} />
                      </div>
                      <div className="absolute right-0 top-0 flex items-center h-full">
                        <span className="text-xs text-muted-foreground">{item.complete}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>Total utilization over project cost</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                {/* Resource utilization chart */}
                <div className="space-y-6">
                  {resourceData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Budget: {item.allocated}% | Actual: {item.actual}%
                        </span>
                      </div>
                      <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
                        {/* Allocated budget bar */}
                        <div
                          className="absolute h-full bg-primary/30 rounded-full"
                          style={{ width: `${item.allocated}%` }}
                        />
                        {/* Actual usage bar */}
                        <div
                          className={`absolute h-full rounded-full ${
                            item.actual > item.allocated ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${item.actual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary/30 rounded-full"></div>
                    <span>Allocated Budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span>Actual Usage</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-destructive rounded-full"></div>
                    <span>Over Budget</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Progress */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activity Progress</CardTitle>
            <CardDescription>Completion level of project activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {selectedProject?.activities?.slice(0, 4).map((activity, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.name}</p>
                    <span className="text-sm font-medium">{activity.progress || 0}%</span>
                  </div>
                  <Progress value={activity.progress || 0} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Due: {new Date(activity.endDate).toLocaleDateString()}</span>
                    <span>{activity.assignedTo ? `Assigned to: ${activity.assignedTo}` : "Unassigned"}</span>
                  </div>
                </div>
              ))}

              {(!selectedProject?.activities || selectedProject.activities.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">
                  No activities defined for this project yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund Release Workflow */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Fund Release Workflow {selectedProject ? `- ${selectedProject.name}` : ""}</CardTitle>
          <CardDescription>Manage milestone budget-based fund release requests</CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedProject ? (
            <div className="text-center py-8 text-muted-foreground">
              Please select a project to view its fund release workflow.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">MILESTONE</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">DUE DATE</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">BUDGET</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">% OF TOTAL</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">STATUS</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {milestoneBudgets.length > 0 ? (
                    milestoneBudgets.map((budget) => {
                      const hasRequest = hasFundReleaseRequest(budget.milestoneId)
                      const requestStatus = getFundReleaseRequestStatus(budget.milestoneId)
                      const percentOfTotal = totalCost > 0 ? (budget.budget / totalCost) * 100 : 0

                      return (
                        <tr key={budget.id} className="border-b border-muted">
                          <td className="py-4 px-4">{budget.milestoneName}</td>
                          <td className="py-4 px-4">{new Date(budget.dueDate).toLocaleDateString()}</td>
                          <td className="py-4 px-4">{formatCurrency(budget.budget)}</td>
                          <td className="py-4 px-4">{percentOfTotal.toFixed(0)}%</td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                budget.status === "Completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                  : budget.status === "In-progress"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {budget.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {hasRequest ? (
                              <span
                                className={`px-3 py-1 rounded-full text-xs ${
                                  requestStatus === "Approved"
                                    ? "bg-green-100 text-green-800"
                                    : requestStatus === "Rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {requestStatus === "Approved"
                                  ? "Approved"
                                  : requestStatus === "Rejected"
                                    ? "Rejected"
                                    : "Request Pending"}
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={requestingFunds === budget.id}
                                onClick={() => handleFundReleaseRequest(budget)}
                                className="whitespace-nowrap"
                              >
                                {requestingFunds === budget.id ? (
                                  <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                ) : null}
                                Submit Fund Release Request
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No milestone budgets found for this project.
                      </td>
                    </tr>
                  )}
                  {milestoneBudgets.length > 0 && (
                    <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">Total</td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700"></td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                        {formatCurrency(totalMilestoneBudget)}
                      </td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                        {totalCost > 0 ? ((totalMilestoneBudget / totalCost) * 100).toFixed(0) : 0}%
                      </td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700"></td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700"></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fund Release Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submit Fund Release Request</DialogTitle>
            <DialogDescription>
              Request funds for milestone completion. This will be sent to the Fund Custodian for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="milestone" className="text-right">
                Milestone
              </Label>
              <Input
                id="milestone"
                value={selectedMilestoneBudget?.milestoneName || ""}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                value={formatCurrency(selectedMilestoneBudget?.budget || 0)}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Provide details about this fund release request"
                className="col-span-3"
                value={releaseDescription}
                onChange={(e) => setReleaseDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
