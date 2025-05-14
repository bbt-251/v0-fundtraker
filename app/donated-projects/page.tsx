"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getUserDonations } from "@/services/donation-service"
import { getProjectsByIds } from "@/services/project-service"
import type { Donation } from "@/types/donation"
import type { Project } from "@/types/project"
import { ProjectCard } from "@/components/project-card"
import { useToast } from "@/components/ui/toast"
import { DollarSign, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow } from "date-fns"
import { FundAllocationModal } from "@/components/fund-allocation-modal"

interface DonationsByProject {
  project: Project
  donations: Donation[]
  totalAmount: number
}

export default function DonatedProjectsPage() {
  const { user } = useAuth()
  const { error: showError } = useToast()
  const [donatedProjects, setDonatedProjects] = useState<DonationsByProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDonatedProjects() {
      if (!user) return

      try {
        setLoading(true)

        // Get all donations by the current user
        const donations = await getUserDonations(user.uid)

        if (donations.length === 0) {
          setDonatedProjects([])
          return
        }

        // Group donations by project
        const donationsByProjectId = donations.reduce(
          (acc, donation) => {
            const { projectId } = donation
            if (!acc[projectId]) {
              acc[projectId] = []
            }
            acc[projectId].push(donation)
            return acc
          },
          {} as Record<string, Donation[]>,
        )

        // Get project IDs
        const projectIds = Object.keys(donationsByProjectId)

        // Fetch project details
        const projects = await getProjectsByIds(projectIds)

        // Combine project details with donations
        const result = projects.map((project) => {
          const projectDonations = donationsByProjectId[project.id] || []
          const totalAmount = projectDonations.reduce((sum, donation) => sum + donation.amount, 0)

          return {
            project,
            donations: projectDonations,
            totalAmount,
          }
        })

        setDonatedProjects(result)
      } catch (error: any) {
        showError(error.message || "Failed to fetch donated projects")
      } finally {
        setLoading(false)
        console.log("Helloo")
      }
    }

    fetchDonatedProjects()
  }, [user])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Unknown date"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  // Calculate percentage of donation to project goal
  const calculatePercentage = (amount: number, goal: number) => {
    if (!goal || goal === 0) return "N/A"
    const percentage = (amount / goal) * 100
    return `${percentage.toFixed(2)}%`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Donated Projects</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : donatedProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No donations yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't made any donations yet. Explore projects and make a difference today!
          </p>
          <Button asChild>
            <Link href="/donor-dashboard">Browse Projects</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {donatedProjects.map(({ project, donations, totalAmount }) => (
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <ProjectCard project={project} isDonorView={false} />
                </div>

                <div className="md:col-span-2 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Your Donations to {project.name}
                  </h2>

                  <div className="flex items-center mb-4">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      Total Donated: {formatCurrency(totalAmount)}
                    </span>
                  </div>

                  <div className="space-y-4 mt-6">
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">Donation History</h3>

                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Message
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Project Cost
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Fund Allocation
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {donations.map((donation) => (
                            <tr key={donation.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(donation.amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatDate(donation.timestamp)}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {donation.message || "No message"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {calculatePercentage(donation.amount, project.cost??0)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                <FundAllocationModal
                                  donationId={donation.id}
                                  projectId={project.id}
                                  amount={donation.amount}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/project-details/${project.id}`}>View Project Details</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
