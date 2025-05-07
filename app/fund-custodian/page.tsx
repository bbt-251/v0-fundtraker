"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, DollarSign, Users, Clock, BarChart4, Loader2, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { toast } from "@/components/ui/use-toast"
import ProjectFundStatus from "@/components/project-fund-status"
import RecentDonations from "@/components/recent-donations"
import { AppHeader } from "@/components/app-header"

// Sample data for Monthly Cash Flow
const monthlyData = [
  { name: "Jan", inflow: 45000, outflow: 22000 },
  { name: "Feb", inflow: 52000, outflow: 28000 },
  { name: "Mar", inflow: 48000, outflow: 24000 },
  { name: "Apr", inflow: 61000, outflow: 35000 },
  { name: "May", inflow: 55000, outflow: 31000 },
  { name: "Jun", inflow: 67000, outflow: 42000 },
  { name: "Jul", inflow: 72000, outflow: 48000 },
]

// Sample data for Fund Allocation by Project
const projectAllocationData = [
  { name: "Clean Water Initiative", value: 125000 },
  { name: "Sustainable Energy", value: 78500 },
  { name: "Education for All", value: 45000 },
  { name: "Healthcare Access", value: 65000 },
  { name: "Agricultural Development", value: 20000 },
]

// Colors for the pie chart
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

// Drawer component
interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
      <div
        className="bg-white dark:bg-gray-800 rounded-t-lg w-full max-w-4xl max-h-[80vh] overflow-y-auto animate-slide-up"
        style={{
          animationDuration: "0.3s",
          boxShadow: "0 -4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// Types for our data
interface Donation {
  id: string
  amount: number
  userId: string
  donorName: string
  projectId: string
  projectName: string
  date: any // Firestore timestamp
  status: string
}

interface Donor {
  id: string
  name: string
  email: string
  totalDonated: number
  lastDonation: any // Firestore timestamp
  projectsSupported: number
}

interface FundRequest {
  id: string
  projectId: string
  projectName: string
  accountName: string
  accountNumber: string
  bankName: string
  accountType: string
  amount: number
  purpose: string
  requestedBy: string
  requestDate: any // Firestore timestamp
  status: string
}

interface Project {
  id: string
  name: string
  description: string
  imageUrl: string
  location: string
  organizationId: string
  fundAccounts: any[]
  milestones: Milestone[]
  milestoneBudgets: MilestoneBudget[]
}

interface Milestone {
  id: string
  name: string
  description: string
  date: any
  status: string
}

interface MilestoneBudget {
  id: string
  milestoneId: string
  milestoneName?: string
  budget: number
  dueDate?: string
  status?: string
}

// Define a type for tracking loading states of specific actions
type ActionLoadingState = {
  requestId: string
  action: "approve" | "refuse"
}

export default function FundCustodianDashboard() {
  const [mainTab, setMainTab] = useState("collection")
  const [disbursementTab, setDisbursementTab] = useState("active")
  const [withdrawalTab, setWithdrawalTab] = useState("scheduled")
  const { userProfile } = useAuth()

  // Data states
  const [totalFundsManaged, setTotalFundsManaged] = useState(0)
  const [totalDonors, setTotalDonors] = useState(0)
  const [pendingBankRequests, setPendingBankRequests] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerTitle, setDrawerTitle] = useState("")
  const [drawerContent, setDrawerContent] = useState<React.ReactNode>(null)

  // Detailed data states
  const [donations, setDonations] = useState<Donation[]>([])
  const [donors, setDonors] = useState<Donor[]>([])
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([])

  // Add this after other state declarations
  const [projectsWithMilestones, setProjectsWithMilestones] = useState<Project[]>([])
  const [allMilestoneBudgets, setAllMilestoneBudgets] = useState<MilestoneBudget[]>([])

  // Track loading state for specific buttons
  const [actionLoading, setActionLoading] = useState<ActionLoadingState | null>(null)
  const [verifyingMilestone, setVerifyingMilestone] = useState(false)

  // Add these new state variables after other state declarations
  const [selectedMilestone, setSelectedMilestone] = useState<any>(null)
  const [isMilestoneDetailsOpen, setIsMilestoneDetailsOpen] = useState(false)

  // Add this helper function before the useEffect
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "green"
      case "In Progress":
        return "blue"
      case "Delayed":
        return "red"
      case "Planned":
        return "yellow"
      default:
        return "yellow"
    }
  }

  useEffect(() => {
    // Update the fetchDashboardData function in useEffect
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)

        // Fetch all donations
        const donationsRef = collection(db, "donations")
        const donationsQuery = query(donationsRef, where("status", "==", "completed"))
        const donationsSnapshot = await getDocs(donationsQuery)

        const donationsData: Donation[] = []
        let totalDonationsAmount = 0
        const uniqueDonorIds = new Set<string>()
        const donorsMap = new Map<string, Donor>()

        // Create a single anonymous donor entity
        const anonymousDonor: Donor = {
          id: "anonymous",
          name: "Anonymous",
          email: "",
          totalDonated: 0,
          lastDonation: null,
          projectsSupported: 0,
        }

        const projectsByAnonymous = new Set<string>()

        donationsSnapshot.forEach((doc) => {
          const data = doc.data()
          const donation: Donation = {
            id: doc.id,
            amount: data.amount || 0,
            userId: data.userId || "",
            donorName: data.donorName || "Anonymous",
            projectId: data.projectId || "",
            projectName: data.projectName || "Unknown Project",
            date: data.timestamp,
            status: data.status || "completed",
          }

          donationsData.push(donation)
          totalDonationsAmount += donation.amount

          // Check if donation is anonymous
          if (data.isAnonymous || !donation.userId || donation.donorName === "Anonymous") {
            // Add to anonymous donor
            anonymousDonor.totalDonated += donation.amount

            if (donation.projectId) {
              projectsByAnonymous.add(donation.projectId)
            }

            // Update last donation if this one is more recent
            if (
              donation.date &&
              (!anonymousDonor.lastDonation ||
                (anonymousDonor.lastDonation && donation.date.toDate() > anonymousDonor.lastDonation.toDate()))
            ) {
              anonymousDonor.lastDonation = donation.date
            }
          } else {
            // Regular named donor
            uniqueDonorIds.add(donation.userId)

            if (!donorsMap.has(donation.userId)) {
              donorsMap.set(donation.userId, {
                id: donation.userId,
                name: donation.donorName,
                email: data.donorEmail || "",
                totalDonated: donation.amount,
                lastDonation: donation.date,
                projectsSupported: 1,
              })
            } else {
              const donor = donorsMap.get(donation.userId)!
              donor.totalDonated += donation.amount

              // Update last donation if this one is more recent
              if (donation.date && donor.lastDonation && donation.date.toDate() > donor.lastDonation.toDate()) {
                donor.lastDonation = donation.date
              }

              // Count unique projects supported
              const projectIds = new Set<string>()
              donationsData.filter((d) => d.userId === donation.userId).forEach((d) => projectIds.add(d.projectId))

              donor.projectsSupported = projectIds.size
            }
          }
        })

        // Update anonymous donor projects count
        anonymousDonor.projectsSupported = projectsByAnonymous.size

        // Add anonymous donor to the map if they made any donations
        if (anonymousDonor.totalDonated > 0) {
          donorsMap.set("anonymous", anonymousDonor)
          uniqueDonorIds.add("anonymous")
        }

        // Fetch all projects to get fund account requests and milestones
        const projectsRef = collection(db, "projects")
        const projectsSnapshot = await getDocs(projectsRef)

        const fundRequestsData: FundRequest[] = []
        const projectsWithMilestonesData: Project[] = []
        const allMilestoneBudgetsData: MilestoneBudget[] = []

        projectsSnapshot.forEach((doc) => {
          const projectData = doc.data() as Project
          projectData.id = doc.id

          // Check if project has milestones and milestone budgets
          if (
            (projectData.milestones && projectData.milestones.length > 0) ||
            (projectData.milestoneBudgets && projectData.milestoneBudgets.length > 0)
          ) {
            projectsWithMilestonesData.push(projectData)

            // Collect all milestone budgets
            if (projectData.milestoneBudgets && Array.isArray(projectData.milestoneBudgets)) {
              projectData.milestoneBudgets.forEach((budget) => {
                allMilestoneBudgetsData.push({
                  ...budget,
                  projectId: projectData.id,
                  projectName: projectData.name,
                })
              })
            }
          }

          // Count pending fund account requests
          if (projectData.fundAccounts && Array.isArray(projectData.fundAccounts)) {
            projectData.fundAccounts.forEach((account: any) => {
              if (account.status === "Pending") {
                fundRequestsData.push({
                  id: account.id || Math.random().toString(36).substring(2, 9),
                  projectId: doc.id,
                  projectName: projectData.name || "Unknown Project",
                  accountName: account.accountName || "",
                  accountNumber: account.accountNumber || "",
                  bankName: account.bankName || "",
                  accountType: account.accountType || "Domestic Account",
                  amount: account.amount || 0,
                  purpose: account.purpose || "",
                  requestedBy: account.requestedBy || "",
                  requestDate: account.createdAt,
                  status: account.status,
                })
              }
            })
          }
        })

        // Update state with fetched data
        setTotalFundsManaged(totalDonationsAmount)
        setTotalDonors(uniqueDonorIds.size)
        setPendingBankRequests(fundRequestsData.length)

        // Set detailed data
        setDonations(donationsData)
        setDonors(Array.from(donorsMap.values()))
        setFundRequests(fundRequestsData)
        setProjectsWithMilestones(projectsWithMilestonesData)
        setAllMilestoneBudgets(allMilestoneBudgetsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Update the formatDate function
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      // Check if timestamp is a Firestore timestamp or a string
      if (typeof timestamp === "string") {
        return timestamp
      }
      const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp)

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(date)
    } catch (error) {
      return "Invalid date"
    }
  }

  // Update the bank requests drawer content to include loading state
  const getBankRequestsDrawerContent = () => {
    return (
      <div className="bg-gray-900 text-white p-6 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 font-medium text-gray-400">ACCOUNT NAME</th>
                <th className="text-left py-3 font-medium text-gray-400">BANK NAME</th>
                <th className="text-left py-3 font-medium text-gray-400">ACCOUNT TYPE</th>
                <th className="text-left py-3 font-medium text-gray-400">STATUS</th>
                <th className="text-left py-3 font-medium text-gray-400">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {fundRequests.length > 0 ? (
                fundRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-700">
                    <td className="py-4">{request.accountName}</td>
                    <td className="py-4">{request.bankName}</td>
                    <td className="py-4">{request.accountType}</td>
                    <td className="py-4">
                      <span className="bg-yellow-900 text-yellow-300 px-3 py-1 rounded-full text-xs">Pending</span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-green-900 hover:bg-green-800 text-green-300 border-green-700"
                          onClick={() => handleFundRequestUpdate(request.id, request.projectId, "Approved", "approve")}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading?.requestId === request.id && actionLoading?.action === "approve" ? (
                            <span className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            "Approve"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-900 hover:bg-red-800 text-red-300 border-red-700"
                          onClick={() => handleFundRequestUpdate(request.id, request.projectId, "Refused", "refuse")}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading?.requestId === request.id && actionLoading?.action === "refuse" ? (
                            <span className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </span>
                          ) : (
                            "Refuse"
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-gray-400">
                    No bank account requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Update the handleFundRequestUpdate function to include loading state
  const handleFundRequestUpdate = async (
    requestId: string,
    projectId: string,
    newStatus: "Approved" | "Refused",
    action: "approve" | "refuse",
  ) => {
    try {
      // Set the loading state for this specific action
      setActionLoading({ requestId, action })

      // Update the drawer content to show the loading state
      setDrawerContent(getBankRequestsDrawerContent())

      // Get the project document
      const projectRef = doc(db, "projects", projectId)
      const projectDoc = await getDocs(query(collection(db, "projects"), where("__name__", "==", projectId)))

      if (projectDoc.empty) {
        throw new Error("Project not found")
      }

      const projectData = projectDoc.docs[0].data()

      // Update the fund account status
      if (projectData.fundAccounts && Array.isArray(projectData.fundAccounts)) {
        const updatedFundAccounts = projectData.fundAccounts.map((account: any) => {
          if (account.id === requestId) {
            return {
              ...account,
              status: newStatus,
            }
          }
          return account
        })

        // Update the project document
        await updateDoc(projectRef, {
          fundAccounts: updatedFundAccounts,
        })

        // Update local state immediately to remove the request from the list
        setFundRequests((prev) =>
          prev.filter((request) => !(request.id === requestId && request.projectId === projectId)),
        )

        setPendingBankRequests((prev) => prev - 1)

        toast({
          title: "Success",
          description: `Fund request ${newStatus.toLowerCase()} successfully.`,
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error updating fund request:", error)
      toast({
        title: "Error",
        description: "Failed to update fund request. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Clear the loading state
      setActionLoading(null)

      // Close the drawer
      setIsDrawerOpen(false)

      // Update the pending bank requests count in the UI
      setPendingBankRequests((prev) => Math.max(0, prev - 1))
    }
  }

  // Open drawer for total funds managed
  const openFundsDrawer = () => {
    setDrawerTitle("Total Funds Managed")
    setDrawerContent(
      <div>
        <h3 className="text-lg font-medium mb-4">All Donations</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Donor</th>
                <th className="text-left py-3 font-medium">Project</th>
                <th className="text-left py-3 font-medium">Amount</th>
                <th className="text-left py-3 font-medium">Date</th>
                <th className="text-left py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {donations.length > 0 ? (
                donations.map((donation) => (
                  <tr key={donation.id} className="border-b">
                    <td className="py-3">{donation.donorName}</td>
                    <td className="py-3">{donation.projectName}</td>
                    <td className="py-3">{formatCurrency(donation.amount)}</td>
                    <td className="py-3">{formatDate(donation.date)}</td>
                    <td className="py-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                    No donations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>,
    )
    setIsDrawerOpen(true)
  }

  // Open drawer for total donors
  const openDonorsDrawer = () => {
    setDrawerTitle("Total Donors")
    setDrawerContent(
      <div>
        <h3 className="text-lg font-medium mb-4">All Donors</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium">Name</th>
                <th className="text-left py-3 font-medium">Total Donated</th>
                <th className="text-left py-3 font-medium">Projects Supported</th>
                <th className="text-left py-3 font-medium">Last Donation</th>
              </tr>
            </thead>
            <tbody>
              {donors.length > 0 ? (
                donors.map((donor) => (
                  <tr key={donor.id} className="border-b">
                    <td className="py-3">{donor.name}</td>
                    <td className="py-3">{formatCurrency(donor.totalDonated)}</td>
                    <td className="py-3">{donor.projectsSupported}</td>
                    <td className="py-3">{formatDate(donor.lastDonation)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted-foreground">
                    No donors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>,
    )
    setIsDrawerOpen(true)
  }

  // Update the bank requests drawer content to include loading state
  const openBankRequestsDrawer = () => {
    setDrawerTitle("Bank Account Requests")
    setDrawerContent(getBankRequestsDrawerContent())
    if (!isDrawerOpen) {
      setIsDrawerOpen(true)
    }
  }

  // Add this function before the return statement
  const handleMilestoneDetails = (project: Project, milestone: Milestone, budget: MilestoneBudget) => {
    setSelectedMilestone({
      ...milestone,
      projectName: project.name,
      projectId: project.id,
      budget: budget?.budget || 0,
      projectDescription: project.description,
      dueDate: budget?.dueDate || milestone.date,
      milestoneBudgetId: budget?.id,
      milestoneBudgetStatus: budget?.status || milestone.status,
    })

    setIsMilestoneDetailsOpen(true)
  }

  // Add this function to handle milestone verification
  const handleVerifyMilestone = async (milestoneId: string, projectId: string, budgetId: string) => {
    try {
      setVerifyingMilestone(true)

      // Get the project document
      const projectRef = doc(db, "projects", projectId)
      const projectSnap = await getDoc(projectRef)

      if (!projectSnap.exists()) {
        throw new Error("Project not found")
      }

      const projectData = projectSnap.data()

      // Update milestone status
      if (projectData.milestones && Array.isArray(projectData.milestones)) {
        const updatedMilestones = projectData.milestones.map((m: any) => {
          if (m.id === milestoneId) {
            return {
              ...m,
              status: "Completed",
            }
          }
          return m
        })

        // Update milestone budget status
        let updatedMilestoneBudgets = projectData.milestoneBudgets || []
        if (budgetId && Array.isArray(projectData.milestoneBudgets)) {
          updatedMilestoneBudgets = projectData.milestoneBudgets.map((b: any) => {
            if (b.id === budgetId || b.milestoneId === milestoneId) {
              return {
                ...b,
                status: "Completed",
              }
            }
            return b
          })
        }

        // Update the project document
        await updateDoc(projectRef, {
          milestones: updatedMilestones,
          milestoneBudgets: updatedMilestoneBudgets,
        })

        // Update local state
        setProjectsWithMilestones((prev) =>
          prev.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                milestones: updatedMilestones,
                milestoneBudgets: updatedMilestoneBudgets,
              }
            }
            return p
          }),
        )

        // Update selected milestone
        setSelectedMilestone((prev) => ({
          ...prev,
          status: "Completed",
          milestoneBudgetStatus: "Completed",
        }))

        toast({
          title: "Success",
          description: "Milestone verified successfully.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error verifying milestone:", error)
      toast({
        title: "Error",
        description: "Failed to verify milestone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifyingMilestone(false)
    }
  }

  // Function to release funds for a milestone
  const handleReleaseFunds = async (milestoneId: string, projectId: string, budgetId: string, amount: number) => {
    try {
      setVerifyingMilestone(true)

      // Here you would implement the actual fund release logic
      // For now, we'll just show a success message

      toast({
        title: "Success",
        description: `${formatCurrency(amount)} released successfully for milestone.`,
        variant: "default",
      })

      // Close the milestone details drawer
      setIsMilestoneDetailsOpen(false)
    } catch (error) {
      console.error("Error releasing funds:", error)
      toast({
        title: "Error",
        description: "Failed to release funds. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVerifyingMilestone(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Use the shared AppHeader component */}
      <AppHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Fund Custodian Dashboar</h1>

        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-0">
            <Tabs value={mainTab} onValueChange={setMainTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-muted/50 p-0 h-auto">
                <TabsTrigger
                  value="collection"
                  className="flex items-center gap-2 py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
                >
                  <FileText className="h-4 w-4" />
                  <span>Fund Collection & Management</span>
                </TabsTrigger>
                <TabsTrigger
                  value="disbursement"
                  className="flex items-center gap-2 py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Fund Disbursement Workflow</span>
                </TabsTrigger>
                <TabsTrigger
                  value="withdrawal"
                  className="flex items-center gap-2 py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600"
                >
                  <BarChart4 className="h-4 w-4" />
                  <span>Fund Withdrawal & Reporting</span>
                </TabsTrigger>
              </TabsList>

              {/* Fund Collection & Management Tab */}
              <TabsContent value="collection" className="p-6 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <Card
                    className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={openFundsDrawer}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Total Funds Managed</h3>
                          <p className="text-3xl font-bold">
                            {isLoading ? (
                              <span className="flex items-center">
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              </span>
                            ) : (
                              formatCurrency(totalFundsManaged)
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Across all projects</p>
                        </div>
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={openDonorsDrawer}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Total Donors</h3>
                          <p className="text-3xl font-bold">
                            {isLoading ? (
                              <span className="flex items-center">
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              </span>
                            ) : (
                              totalDonors
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Supporting our projects</p>
                        </div>
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Pending Receipts</h3>
                          <p className="text-3xl font-bold">0</p>
                          <p className="text-xs text-muted-foreground">Waiting to be sent</p>
                        </div>
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={openBankRequestsDrawer}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Pending Bank Requests</h3>
                          <p className="text-3xl font-bold">
                            {isLoading ? (
                              <span className="flex items-center">
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              </span>
                            ) : (
                              pendingBankRequests
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Awaiting approval</p>
                        </div>
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Project Fund Status Component */}
                <ProjectFundStatus className="mb-8" />

                {/* RECENT DONATIONS */}
                <RecentDonations className="mb-8" />
              </TabsContent>

              {/* Fund Disbursement Workflow Tab */}
              <TabsContent value="disbursement" className="p-6 bg-white dark:bg-gray-800">
                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold">Fund Disbursement Overview</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage milestone-based disbursements and ensure structured release of funds
                    </p>

                    <Tabs value={disbursementTab} onValueChange={setDisbursementTab} className="mt-6">
                      <TabsList className="grid grid-cols-2 w-full bg-muted/50">
                        <TabsTrigger value="active">Active Workflows</TabsTrigger>
                        <TabsTrigger value="release">Fund Release Requests</TabsTrigger>
                      </TabsList>

                      {/* Active Workflows Tab */}
                      <TabsContent value="active" className="space-y-6 mt-6">
                        <h3 className="text-lg font-bold">Active Project Disbursement Workflows</h3>

                        {isLoading ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          </div>
                        ) : (
                          <>
                            {projectsWithMilestones.length > 0 ? (
                              projectsWithMilestones.map((project) => (
                                <Card key={project.id} className="shadow-sm mb-6">
                                  <CardContent className="p-6">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="text-lg font-bold">{project.name}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          Milestone-based fund disbursement workflow
                                        </p>
                                      </div>

                                      <div className="overflow-x-auto">
                                        <table className="w-full">
                                          <thead>
                                            <tr className="border-b">
                                              <th className="text-left py-3 font-medium">Milestone</th>
                                              <th className="text-left py-3 font-medium">Amount</th>
                                              <th className="text-left py-3 font-medium">Due Date</th>
                                              <th className="text-left py-3 font-medium">Status</th>
                                              <th className="text-left py-3 font-medium">Action</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {project.milestoneBudgets && project.milestoneBudgets.length > 0 ? (
                                              project.milestoneBudgets.map((budget) => {
                                                // Find the corresponding milestone
                                                const milestone = project.milestones?.find(
                                                  (m) => m.id === budget.milestoneId,
                                                ) || {
                                                  id: budget.milestoneId,
                                                  name: budget.milestoneName || "Unknown Milestone",
                                                  description: "",
                                                  date: budget.dueDate,
                                                  status: budget.status || "Planned",
                                                }

                                                return (
                                                  <tr key={budget.id} className="border-b">
                                                    <td className="py-4">
                                                      <div>
                                                        <p className="font-medium">
                                                          {budget.milestoneName || milestone.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                          {milestone.description || `Milestone for ${project.name}`}
                                                        </p>
                                                      </div>
                                                    </td>
                                                    <td className="py-4">{formatCurrency(budget.budget)}</td>
                                                    <td className="py-4">
                                                      {formatDate(budget.dueDate || milestone.date)}
                                                    </td>
                                                    <td className="py-4">
                                                      <span
                                                        className={`bg-${getStatusColor(budget.status || milestone.status)}-100 text-${getStatusColor(budget.status || milestone.status)}-800 px-2 py-1 rounded-full text-xs`}
                                                      >
                                                        {budget.status || milestone.status}
                                                      </span>
                                                    </td>
                                                    <td className="py-4">
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                          handleMilestoneDetails(project, milestone, budget)
                                                        }
                                                      >
                                                        Details
                                                      </Button>
                                                    </td>
                                                  </tr>
                                                )
                                              })
                                            ) : (
                                              <tr>
                                                <td colSpan={6} className="py-4 text-center text-muted-foreground">
                                                  No milestones found for this project
                                                </td>
                                              </tr>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <Card className="shadow-sm">
                                <CardContent className="p-6 text-center">
                                  <p className="text-muted-foreground">No active project workflows found</p>
                                </CardContent>
                              </Card>
                            )}
                          </>
                        )}
                      </TabsContent>

                      {/* Fund Release Requests Tab */}
                      <TabsContent value="release" className="space-y-6 mt-6">
                        <h3 className="text-lg font-bold">Pending Fund Release Requests</h3>

                        <Card className="shadow-sm">
                          <CardContent className="p-6">
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-3 font-medium">Project</th>
                                    <th className="text-left py-3 font-medium">Milestone</th>
                                    <th className="text-left py-3 font-medium">Requested By</th>
                                    <th className="text-left py-3 font-medium">Request Date</th>
                                    <th className="text-left py-3 font-medium">Amount</th>
                                    <th className="text-left py-3 font-medium">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="py-4">Sustainable Energy Project</td>
                                    <td className="py-4">Installation Phase 1</td>
                                    <td className="py-4">Alex Johnson</td>
                                    <td className="py-4">Jun 20, 2023, 12:30 PM</td>
                                    <td className="py-4">$25,000</td>
                                    <td className="py-4">
                                      <Button variant="outline" size="sm">
                                        Review
                                      </Button>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fund Withdrawal & Reporting Tab */}
              <TabsContent value="withdrawal" className="p-6 bg-white dark:bg-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Total Raised</h3>
                          <p className="text-3xl font-bold">$333,500</p>
                          <p className="text-xs text-muted-foreground">Across all projects</p>
                        </div>
                        <BarChart4 className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Total Disbursed</h3>
                          <p className="text-3xl font-bold">$140,000</p>
                          <p className="text-xs text-muted-foreground">42% of funds raised</p>
                        </div>
                        <DollarSign className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Pending Disbursement</h3>
                          <p className="text-3xl font-bold">$85,000</p>
                          <p className="text-xs text-muted-foreground">25% of funds raised</p>
                        </div>
                        <Clock className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-sm text-muted-foreground">Remaining Funds</h3>
                          <p className="text-3xl font-bold">$108,500</p>
                          <p className="text-xs text-muted-foreground">33% of funds raised</p>
                        </div>
                        <DollarSign className="h-5 w-5 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="shadow-sm">
                  <CardContent className="p-6">
                    <Tabs value={withdrawalTab} onValueChange={setWithdrawalTab} className="w-full">
                      <TabsList className="grid grid-cols-3 w-full bg-muted/50">
                        <TabsTrigger value="scheduled">Scheduled Transfers</TabsTrigger>
                        <TabsTrigger value="reports">Financial Reports</TabsTrigger>
                        <TabsTrigger value="analytics">Cash Flow Analytics</TabsTrigger>
                      </TabsList>

                      {/* Scheduled Transfers Tab */}
                      <TabsContent value="scheduled" className="space-y-6 mt-6">
                        <h3 className="text-lg font-bold">Scheduled Fund Transfers</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage and schedule fund transfers to project owners upon milestone approval
                        </p>

                        <div className="overflow-x-auto mt-6">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 font-medium">Project</th>
                                <th className="text-left py-3 font-medium">Milestone</th>
                                <th className="text-left py-3 font-medium">Recipient</th>
                                <th className="text-left py-3 font-medium">Amount</th>
                                <th className="text-left py-3 font-medium">Scheduled Date</th>
                                <th className="text-left py-3 font-medium">Status</th>
                                <th className="text-left py-3 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="py-4">Clean Water Initiative</td>
                                <td className="py-4">Initial Site Assessment</td>
                                <td className="py-4">Clean Water Foundation</td>
                                <td className="py-4">$30,000</td>
                                <td className="py-4">Jun 28, 2023, 01:00 PM</td>
                                <td className="py-4">
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                    Pending
                                  </span>
                                </td>
                                <td className="py-4">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                      Process
                                    </Button>
                                    <Button variant="outline" size="sm">
                                      Notify
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-4">Sustainable Energy Project</td>
                                <td className="py-4">Solar Panel Procurement</td>
                                <td className="py-4">Green Energy Alliance</td>
                                <td className="py-4">$35,000</td>
                                <td className="py-4">Jun 25, 2023, 05:30 PM</td>
                                <td className="py-4">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                    Completed
                                  </span>
                                </td>
                                <td className="py-4">
                                  <Button variant="outline" size="sm">
                                    Notify
                                  </Button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* Financial Reports Tab */}
                      <TabsContent value="reports" className="space-y-6 mt-6">
                        <h3 className="text-lg font-bold">Project Financial Reports</h3>
                        <p className="text-sm text-muted-foreground">
                          Generate and view financial reports for each project
                        </p>

                        <div className="overflow-x-auto mt-6">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 font-medium">Project</th>
                                <th className="text-left py-3 font-medium">Total Raised</th>
                                <th className="text-left py-3 font-medium">Disbursed</th>
                                <th className="text-left py-3 font-medium">Pending</th>
                                <th className="text-left py-3 font-medium">Remaining</th>
                                <th className="text-left py-3 font-medium">Status</th>
                                <th className="text-left py-3 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b">
                                <td className="py-4">Clean Water Initiative</td>
                                <td className="py-4">$125,000</td>
                                <td className="py-4">$30,000</td>
                                <td className="py-4">$50,000</td>
                                <td className="py-4">$45,000</td>
                                <td className="py-4">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Active
                                  </span>
                                </td>
                                <td className="py-4">
                                  <Button variant="outline" size="sm">
                                    Report
                                  </Button>
                                </td>
                              </tr>
                              <tr className="border-b">
                                <td className="py-4">Sustainable Energy Project</td>
                                <td className="py-4">$78,500</td>
                                <td className="py-4">$35,000</td>
                                <td className="py-4">$25,000</td>
                                <td className="py-4">$18,500</td>
                                <td className="py-4">
                                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                    Active
                                  </span>
                                </td>
                                <td className="py-4">
                                  <Button variant="outline" size="sm">
                                    Report
                                  </Button>
                                </td>
                              </tr>
                              <tr>
                                <td className="py-4">Education for All</td>
                                <td className="py-4">$45,000</td>
                                <td className="py-4">$0</td>
                                <td className="py-4">$0</td>
                                <td className="py-4">$45,000</td>
                                <td className="py-4">
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                    Pending
                                  </span>
                                </td>
                                <td className="py-4">
                                  <Button variant="outline" size="sm">
                                    Report
                                  </Button>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>

                      {/* Cash Flow Analytics Tab */}
                      <TabsContent value="analytics" className="space-y-6 mt-6">
                        <h3 className="text-lg font-bold">Cash Flow Analytics</h3>
                        <p className="text-sm text-muted-foreground">Visualize fund inflows and outflows over time</p>

                        <div className="mt-6">
                          <h4 className="text-lg font-medium">Monthly Cash Flow</h4>
                          <div className="h-64 mt-4 border rounded-md p-4 bg-white">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={monthlyData}
                                margin={{
                                  top: 10,
                                  right: 30,
                                  left: 0,
                                  bottom: 0,
                                }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Legend />
                                <Area
                                  type="monotone"
                                  dataKey="inflow"
                                  name="Fund Inflow"
                                  stackId="1"
                                  stroke="#0088FE"
                                  fill="#0088FE"
                                  fillOpacity={0.6}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="outflow"
                                  name="Fund Outflow"
                                  stackId="2"
                                  stroke="#FF8042"
                                  fill="#FF8042"
                                  fillOpacity={0.6}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        <div className="mt-8">
                          <h4 className="text-lg font-medium">Fund Allocation by Project</h4>
                          <div className="h-64 mt-4 border rounded-md p-4 bg-white">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={projectAllocationData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                  {projectAllocationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value}`} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Milestone Details Modal */}
      <Drawer
        isOpen={isMilestoneDetailsOpen}
        onClose={() => setIsMilestoneDetailsOpen(false)}
        title="Milestone Details"
      >
        {selectedMilestone && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold">{selectedMilestone.name}</h3>
              <p className="text-sm text-muted-foreground">Project: {selectedMilestone.projectName}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Status</h4>
                <p>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                    {selectedMilestone.status || "Planned"}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Budget</h4>
                <p className="font-bold">{formatCurrency(selectedMilestone.budget)}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Due Date</h4>
                <p>{formatDate(selectedMilestone.dueDate || selectedMilestone.date)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Description</h4>
              <p className="text-sm">{selectedMilestone.description}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Project Description</h4>
              <p className="text-sm">{selectedMilestone.projectDescription}</p>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button onClick={() => setIsMilestoneDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Drawer */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={drawerTitle}>
        {drawerContent}
      </Drawer>
    </div>
  )
}
