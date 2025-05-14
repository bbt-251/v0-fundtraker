"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { getProject } from "@/services/project-service"
import { getDonationById, getProjectDonations } from "@/services/donation-service"
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
  contributionPercentage?: number
  remainingCost?: number
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
  allocationAmount?: number
}

interface DonationWithTimestamp {
  id: string
  amount: number
  timestamp: Date
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

        if (!project) {
          console.error("Project not found")
          return
        }

        // Get all tasks with resources
        let allTasks = project.tasks || []

        // Sort tasks by timestamp (latest first for display)
        allTasks = allTasks.sort((a, b) => {
          const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timestampB - timestampA // Latest first
        })

        // Enhance tasks with human-readable names for resources and calculate initial costs
        const enhancedTasks = allTasks.map((task) => {
          // Calculate completion percentage
          const completionPercentage = calculateCompletionPercentage(task)

          // Enhance resources with names and set initial remaining costs
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
              remainingCost: resource.totalCost || 0, // Initially, all cost is remaining
            }
          })

          return {
            ...task,
            resources: enhancedResources,
            completionPercentage,
          }
        })

        // Get all donations for this project
        const allDonations = await getProjectDonations(projectId)

        // Get the current donation
        const currentDonation = await getDonationById(donationId)

        if (!currentDonation) {
          console.error("Current donation not found")
          return
        }

        // Convert all donations to a format with proper Date objects for timestamp
        const donationsWithTimestamp: DonationWithTimestamp[] = allDonations
          .map((donation) => {
            // Skip the current donation as we'll process it separately
            if (donation.id === donationId) return null

            const timestamp = donation.timestamp ? new Date(donation.timestamp) : new Date()

            return {
              id: donation.id,
              amount: donation.amount,
              timestamp,
            }
          })
          .filter(Boolean) as DonationWithTimestamp[]

        // Add current donation
        const currentDonationTimestamp = currentDonation.timestamp ? new Date(currentDonation.timestamp) : new Date()

        donationsWithTimestamp.push({
          id: donationId,
          amount: amount,
          timestamp: currentDonationTimestamp,
        })

        // Sort donations by timestamp (earliest first for allocation)
        donationsWithTimestamp.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

        // Create a working copy of tasks for allocation
        const workingTasks = JSON.parse(JSON.stringify(enhancedTasks))

        // Sort tasks by timestamp (earliest first for allocation)
        workingTasks.sort((a: Task, b: Task) => {
          const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return timestampA - timestampB // Earliest first for allocation
        })

        // Process all donations in chronological order
        for (const donation of donationsWithTimestamp) {
          let remainingDonationAmount = donation.amount

          // Allocate this donation to tasks
          for (const task of workingTasks) {
            if (remainingDonationAmount <= 0) break

            // Track how much of this donation goes to this task
            let taskAllocation = 0

            for (const resource of task.resources) {
              if (remainingDonationAmount <= 0) break

              // Skip resources that are already fully funded
              if (resource.remainingCost <= 0) continue

              // Calculate how much to allocate to this resource
              const allocation = Math.min(resource.remainingCost, remainingDonationAmount)

              // Update remaining amounts
              remainingDonationAmount -= allocation
              resource.remainingCost -= allocation

              // If this is the current donation, track the contribution
              if (donation.id === donationId) {
                resource.contributionAmount = allocation
                resource.contributionPercentage = Math.round((allocation / resource.totalCost) * 100)
                taskAllocation += allocation
              }
            }

            // If this is the current donation and we allocated something to this task
            if (donation.id === donationId && taskAllocation > 0) {
              task.allocationAmount = taskAllocation
            }
          }
        }

        // Filter to only show tasks that have allocations from the current donation
        const tasksWithCurrentDonation = workingTasks
          .filter((task: Task) => task.allocationAmount && task.allocationAmount > 0)
          // Sort back to latest first for display
          .sort((a: Task, b: Task) => {
            const timestampA = a.timestamp ? new Date(a.timestamp).getTime() : 0
            const timestampB = b.timestamp ? new Date(b.timestamp).getTime() : 0
            return timestampB - timestampA // Latest first for display
          })

        // Calculate total allocated amount
        const totalAllocated = tasksWithCurrentDonation.reduce(
          (sum: number, task: Task) => sum + (task.allocationAmount || 0),
          0,
        )

        setTasks(tasksWithCurrentDonation)
        setAllocatedAmount(totalAllocated)
      } catch (error) {
        console.error("Error fetching project data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectAndDonationData()
  }, [open, projectId, donationId, amount])

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
                          {task.resources
                            .filter((resource) => resource.contributionAmount && resource.contributionAmount > 0)
                            .map((resource) => (
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
