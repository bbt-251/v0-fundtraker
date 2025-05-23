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
import type {
  Project,
  FundReleaseRequest,
  ProjectActivity,
  ProjectTask,
  ProjectDeliverable,
  DecisionGate,
  HumanResource,
  MaterialResource,
} from "@/types/project"
import type { MilestoneBudget } from "@/components/financial-resource-tab"
import GanttChart from "../ui/ganttChart"
import { ActivityDetailModal } from "../modals/activity-detail-modal"
import { TaskDetailModal } from "../modals/task-detail-modal"
import { DeliverableDetailModal } from "../modals/deliverable-detail-modal"
import { DecisionGateDetailModal } from "../modals/decision-gate-detail-modal"
import { getTeamMembers } from "@/services/team-member-service"

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
    teamMembersCount: 0,
  })

  const [selectedActivity, setSelectedActivity] = useState<ProjectActivity | null>(null)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [selectedDeliverable, setSelectedDeliverable] = useState<ProjectDeliverable | null>(null)
  const [selectedDecisionGate, setSelectedDecisionGate] = useState<DecisionGate | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false)
  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false)
  const [deliverableModalOpen, setDeliverableModalOpen] = useState<boolean>(false)
  const [decisionGateModalOpen, setDecisionGateModalOpen] = useState<boolean>(false)
  const [resourceUtilizationData, setResourceUtilizationData] = useState<
    {
      name: string
      id: string
      allocatedPercent: number
      allocatedAmount: number
      actualPercent: number
      actualAmount: number
      createdAt: string
    }[]
  >([])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

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

  // Calculate resource utilization data for the selected project
  const calculateResourceUtilization = () => {
    if (!selectedProject) return

    const activities = Array.isArray(selectedProject.activities) ? selectedProject.activities : []
    const tasks = Array.isArray(selectedProject.tasks) ? selectedProject.tasks : []

    // Calculate total project cost
    const humanResourceTotal = calculateHumanResourceTotal()
    const materialResourceTotal = calculateMaterialResourceTotal()
    const totalProjectCost = humanResourceTotal + materialResourceTotal

    if (totalProjectCost === 0) return

    const utilizationData = activities.map((activity) => {
      // Get all tasks for this activity
      const activityTasks = tasks.filter((task) => task.activityId === activity.id)

      // Calculate total allocated budget for this activity
      let allocatedAmount = 0
      activityTasks.forEach((task) => {
        if (task.resources) {
          task.resources.forEach((resource) => {
            allocatedAmount += resource.totalCost || 0
          })
        }
      })

      // Calculate actual spent (completed tasks only)
      let actualAmount = 0
      activityTasks
        .filter((task) => task.status === "Completed")
        .forEach((task) => {
          if (task.resources) {
            task.resources.forEach((resource) => {
              actualAmount += resource.totalCost || 0
            })
          }
        })

      // Calculate percentages
      const allocatedPercent = (allocatedAmount / totalProjectCost) * 100
      const actualPercent = (actualAmount / totalProjectCost) * 100

      return {
        name: activity.name,
        id: activity.id,
        allocatedPercent,
        allocatedAmount,
        actualPercent,
        actualAmount,
        createdAt: activity.createdAt || new Date().toISOString(), // Include creation date
      }
    })

    // Sort by creation date (oldest first)
    utilizationData.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateA - dateB
    })

    // Take top 5 activities for display
    setResourceUtilizationData(utilizationData.slice(0, 5))
  }

  // Get the last due date for an activity based on its tasks
  const getActivityDueDate = (activityId: string) => {
    if (!selectedProject) return null

    const activityTasks = Array.isArray(selectedProject.tasks)
      ? selectedProject.tasks.filter((task) => task.activityId === activityId)
      : []

    if (activityTasks.length === 0) return null

    // Find the task with the latest end date
    let latestDate = new Date(0) // Start with earliest possible date

    activityTasks.forEach((task) => {
      if (task.endDate) {
        const taskEndDate = new Date(task.endDate)
        if (taskEndDate > latestDate) {
          latestDate = taskEndDate
        }
      }
    })

    // If we found a valid date (not the initial date)
    if (latestDate.getTime() !== new Date(0).getTime()) {
      return latestDate
    }

    return null
  }

  // Calculate the completion percentage of an activity based on its tasks
  const calculateActivityProgress = (activityId: string) => {
    if (!selectedProject) return 0

    const activityTasks = Array.isArray(selectedProject.tasks)
      ? selectedProject.tasks.filter((task) => task.activityId === activityId)
      : []

    if (activityTasks.length === 0) return 0

    // Count completed tasks
    const completedTasks = activityTasks.filter((task) => task.status === "Completed").length

    // Calculate percentage
    return Math.round((completedTasks / activityTasks.length) * 100)
  }

  // Update resource utilization when selected project, humanResources, or materialResources change
  useEffect(() => {
    if (selectedProject) {
      calculateResourceUtilization()
    }
  }, [selectedProject, humanResources, materialResources])

  const fetchTeamMembers = async () => {
    if (!user?.uid) return

    try {
      // Fetch team members by owner ID, not by project ID
      const members = await getTeamMembers(user.uid)

      // Update the stats with the correct team member count
      setStats((prevStats) => ({
        ...prevStats,
        teamMembersCount: members.length,
      }))
    } catch (error) {
      console.error("Error fetching team members:", error)
    }
  }

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
          teamMembersCount: 0, // Will be updated by fetchTeamMembers
        })

        if (projectsData.length > 0) {
          const firstProject = projectsData[0]
          setSelectedProject(firstProject)
          setHumanResources(firstProject.humanResources || [])
          setMaterialResources(firstProject.materialResources || [])

          // Get milestone budgets for this project
          if (firstProject.milestoneBudgets && firstProject.milestoneBudgets.length > 0) {
            setMilestoneBudgets(firstProject.milestoneBudgets)
          } else {
            // If no milestone budgets found, try to create them from milestones
            const milestones = firstProject.milestones || []
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
          if (firstProject.id) {
            const requests = await getFundReleaseRequests(firstProject.id)
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
    fetchTeamMembers() // This will now fetch by owner ID
  }, [user?.uid]) // Depend on user.uid, not projectId

  // Handle project selection change
  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const projectId = e.target.value
    const project = projects.find((p) => p.id === projectId)

    if (project) {
      // Update all project-related state in one batch
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

  const handleElementClick = (task: any) => {
    // Reset all selections
    setSelectedActivity(null)
    setSelectedTask(null)
    setSelectedDeliverable(null)
    setSelectedDecisionGate(null)

    // Close all modals
    setActivityModalOpen(false)
    setTaskModalOpen(false)
    setDeliverableModalOpen(false)
    setDecisionGateModalOpen(false)

    // Handle based on type
    if (task.type === "project") {
      // Find the activity
      const activities = Array.isArray(selectedProject?.activities) ? selectedProject?.activities : []
      const activity = activities.find((a) => a.id === task.id)
      if (activity) {
        setSelectedActivity(activity)
        setActivityModalOpen(true)
      }
    } else if (task.type === "task") {
      // Find the task
      const tasks = Array.isArray(selectedProject?.tasks) ? selectedProject?.tasks : []
      const projectTask = tasks.find((t) => t.id === task.id)
      if (projectTask) {
        setSelectedTask(projectTask)
        setTaskModalOpen(true)
      }
    } else if (task.type === "milestone") {
      // Check if it's a deliverable or decision gate
      const deliverables = Array.isArray(selectedProject?.deliverables) ? selectedProject?.deliverables : []
      const deliverable = deliverables.find((d) => d.id === task.id)
      if (deliverable) {
        setSelectedDeliverable(deliverable)
        setDeliverableModalOpen(true)
        return
      }

      const decisionGates = Array.isArray(selectedProject?.decisionGates) ? selectedProject?.decisionGates : []
      const decisionGate = decisionGates.find((dg) => dg.id === task.id)
      if (decisionGate) {
        setSelectedDecisionGate(decisionGate)
        setDecisionGateModalOpen(true)
      }
    }
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
              <div className="text-2xl font-bold">{stats.teamMembersCount || 0}</div>
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

        {/* Resource Utilization */}
        <Card className="pb-8">
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
            <CardDescription>Total utilization over project cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              {/* Resource utilization chart */}
              <div className="space-y-6">
                {resourceUtilizationData.length > 0 ? (
                  resourceUtilizationData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Budget: {item.allocatedPercent.toFixed(1)}% ({formatCurrency(item.allocatedAmount)}) | Actual:{" "}
                          {item.actualPercent.toFixed(1)}% ({formatCurrency(item.actualAmount)})
                        </span>
                      </div>
                      <div className="relative h-4 w-full bg-muted rounded-full overflow-hidden">
                        {/* Allocated budget bar */}
                        <div
                          className="absolute h-full bg-primary/30 rounded-full"
                          style={{ width: `${Math.min(item.allocatedPercent, 100)}%` }}
                        />
                        {/* Actual usage bar */}
                        <div
                          className={`absolute h-full rounded-full ${
                            item.actualPercent > item.allocatedPercent ? "bg-destructive" : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(item.actualPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No activity data available for this project.
                  </div>
                )}
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

        {/* Project Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <CardDescription>Gantt chart representation of project schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <GanttChart
              tasks={Array.isArray(selectedProject?.tasks) ? selectedProject.tasks : []}
              activities={Array.isArray(selectedProject?.activities) ? selectedProject.activities : []}
              deliverables={Array.isArray(selectedProject?.deliverables) ? selectedProject.deliverables : []}
              decisionGates={Array.isArray(selectedProject?.decisionGates) ? selectedProject.decisionGates : []}
              chartLoading={false}
              onElementClick={handleElementClick}
            />
          </CardContent>
        </Card>

        {/* Activity Progress */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Activity Progress</CardTitle>
            <CardDescription>Completion level of project activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {selectedProject && Array.isArray(selectedProject.activities) && selectedProject.activities.length > 0 ? (
                selectedProject.activities.slice(0, 4).map((activity, index) => {
                  const dueDate = getActivityDueDate(activity.id)
                  const progress = calculateActivityProgress(activity.id)
                  const activityTasks = Array.isArray(selectedProject.tasks)
                    ? selectedProject.tasks.filter((task) => task.activityId === activity.id)
                    : []

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.name}</p>
                        <span className="text-sm font-medium">
                          {progress}% ({activityTasks.filter((t) => t.status === "Completed").length}/
                          {activityTasks.length} tasks)
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        <span>Due: {dueDate ? dueDate.toLocaleDateString() : "No tasks"}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
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

      {/* Detail Modals */}
      <ActivityDetailModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        activity={selectedActivity}
      />
      <TaskDetailModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} task={selectedTask} />
      <DeliverableDetailModal
        isOpen={deliverableModalOpen}
        onClose={() => setDeliverableModalOpen(false)}
        deliverable={selectedDeliverable}
      />
      <DecisionGateDetailModal
        isOpen={decisionGateModalOpen}
        onClose={() => setDecisionGateModalOpen(false)}
        decisionGate={selectedDecisionGate}
      />
    </div>
  )
}
