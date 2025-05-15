"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { getProject } from "@/services/project-service"
import { getDonationById } from "@/services/donation-service"
import { Progress } from "@/components/ui/progress"

interface FundAllocationModalProps {
  donationId: string
  projectId: string
  amount: number
}

interface Resource {
  id: string
  resourceId: string
  resourceType: "human" | "material"
  quantity: number
  dailyCost: number
  totalCost: number
  name?: string
}

interface Task {
  id: string
  name: string
  status: string
  resources: Resource[]
  startDate: string
  endDate: string
  completionPercentage?: number
  timestamp?: string
}

export function FundAllocationModal({ donationId, projectId, amount }: FundAllocationModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [allocatedAmount, setAllocatedAmount] = useState(0)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Calculate task completion percentage
  const calculateCompletionPercentage = (task: any) => {
    if (task.status === "Completed") return 100
    if (task.status === "Not Started") return 0

    // For in-progress tasks, calculate based on dates
    const startDate = new Date(task.startDate).getTime()
    const endDate = new Date(task.endDate).getTime()
    const currentDate = new Date().getTime()

    if (currentDate <= startDate) return 0
    if (currentDate >= endDate) return 100

    const totalDuration = endDate - startDate
    const elapsedDuration = currentDate - startDate
    return Math.round((elapsedDuration / totalDuration) * 100)
  }

  // Load project tasks and resources
  useEffect(() => {
    if (!open) return

    const fetchProjectAndDonationData = async () => {
      try {
        setLoading(true)
        const project = await getProject(projectId)

        // Also fetch the donation to get its timestamp
        const donationData = await getDonationById(donationId)
        const donationTimestamp = donationData?.timestamp ? new Date(donationData.timestamp).getTime() : Date.now()

        if (!project) {
          console.error("Project not found")
          return
        }

        // Get all tasks with resources
        let allTasks = project.tasks || []

        // Sort tasks by timestamp (latest first)
        allTasks = allTasks.sort((a, b) => {
          const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timestampB - timestampA // Latest first
        })

        // Enhance tasks with human-readable names for resources
        const enhancedTasks = allTasks.map((task) => {
          // Calculate completion percentage
          const completionPercentage = calculateCompletionPercentage(task)

          // Enhance resources with names
          const enhancedResources = (task.resources || []).map((resource) => {
            let name = "Unknown Resource"

            if (resource.resourceType === "human") {
              const humanResource = project.humanResources?.find((hr) => hr.id === resource.resourceId)
              name = humanResource?.name || "Unknown Human Resource"
            } else {
              const materialResource = project.materialResources?.find((mr) => mr.id === resource.resourceId)
              name = materialResource?.name || "Unknown Material Resource"
            }

            return {
              ...resource,
              name,
            }
          })

          return {
            ...task,
            resources: enhancedResources,
            completionPercentage,
          }
        })

        // Allocate donation amount to tasks
        let remainingAmount = amount
        const tasksToShow: Task[] = []

        for (const task of enhancedTasks) {
          if (remainingAmount <= 0) break

          const taskResources = [...task.resources]
          let taskAllocation = 0

          // Calculate how much of this task can be funded by the remaining donation amount
          for (const resource of taskResources) {
            if (remainingAmount <= 0) break

            const resourceCost = resource.totalCost || 0
            const allocation = Math.min(resourceCost, remainingAmount)

            // Update remaining amount
            remainingAmount -= allocation
            taskAllocation += allocation

            // Calculate contribution percentage
            resource.contributionPercentage = Math.round((allocation / resourceCost) * 100)
          }

          if (taskAllocation > 0) {
            tasksToShow.push({
              ...task,
              resources: taskResources,
              allocationAmount: taskAllocation,
            })
          }
        }

        setTasks(tasksToShow)
        setAllocatedAmount(amount - remainingAmount)
      } catch (error) {
        console.error("Error fetching project data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectAndDonationData()
  }, [open, projectId, donationId, amount, getDonationById])

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="View fund allocation">
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] w-[90vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fund Allocation Details</DialogTitle>
            <DialogDescription>
              How your donation of {formatCurrency(amount)} is being allocated in this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center p-4 border rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No allocation data available for this donation yet.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(allocatedAmount)} of your donation has been allocated to the following tasks:
                  </p>
                </div>

                {tasks.map((task) => (
                  <div key={task.id} className="space-y-2 bg-gray-900 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-md font-medium text-white">
                        Task {task.name} : {task.startDate.substring(0, 10)} - {task.completionPercentage}%
                      </h3>
                      <span className="text-sm text-gray-300">{formatCurrency(task.allocationAmount || 0)}</span>
                    </div>

                    <Progress value={task.completionPercentage} className="h-2 mb-4" />

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase text-gray-400">
                            <th className="py-2 px-2">Resource Name</th>
                            <th className="py-2 px-2">Resource Type</th>
                            <th className="py-2 px-2">Quantity</th>
                            <th className="py-2 px-2">Cost</th>
                            <th className="py-2 px-2">Total Cost</th>
                            <th className="py-2 px-2">Contribution</th>
                          </tr>
                        </thead>
                        <tbody>
                          {task.resources.map((resource) => (
                            <tr key={resource.id} className="border-t border-gray-700">
                              <td className="py-2 px-2 text-white">{resource.name}</td>
                              <td className="py-2 px-2 capitalize text-white">{resource.resourceType}</td>
                              <td className="py-2 px-2 text-white">{resource.quantity}</td>
                              <td className="py-2 px-2 text-white">{formatCurrency(resource.dailyCost)}</td>
                              <td className="py-2 px-2 text-white">{formatCurrency(resource.totalCost)}</td>
                              <td className="py-2 px-2 text-white">{resource.contributionPercentage || 0}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
