"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CalendarIcon, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/firebase"
import { formatCurrency } from "@/lib/utils/currency-utils"
import { formatDate } from "@/lib/utils/date-utils"

interface Donation {
  id: string
  donorName: string
  projectId: string
  projectName: string
  amount: number
  date: Date
  status: "pending" | "completed" | "failed"
  paymentMethod: string
}

interface RecentDonationsProps {
  className?: string
}

export default function RecentDonations({ className }: RecentDonationsProps) {
  const [donations, setDonations] = useState<Donation[]>([])
  const [filteredDonations, setFilteredDonations] = useState<Donation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined)
  const [toDate, setToDate] = useState<Date | undefined>(undefined)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [sortField, setSortField] = useState<keyof Donation>("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc") // Default to most recent first

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        setIsLoading(true)

        // Fetch projects first for the filter dropdown and to get project names
        const projectsRef = collection(db, "projects")
        const projectsSnapshot = await getDocs(projectsRef)
        const projectsData: { id: string; name: string }[] = []

        projectsSnapshot.forEach((doc) => {
          const data = doc.data()
          projectsData.push({
            id: doc.id,
            name: data.name || "Unnamed Project",
          })
        })

        setProjects(projectsData)

        // Fetch donations directly from the donations collection
        const donationsRef = collection(db, "donations")
        const donationsSnapshot = await getDocs(donationsRef)
        const donationsData: Donation[] = []

        donationsSnapshot.forEach((doc) => {
          const data = doc.data()
          // Find the project name using the projectId
          const project = projectsData.find((p) => p.id === data.projectId) || {
            id: data.projectId || "",
            name: "Unknown Project",
          }

          donationsData.push({
            id: doc.id,
            donorName: data.donorName || "Anonymous",
            projectId: data.projectId || "",
            projectName: project.name,
            amount: data.amount || 0,
            date: data.timestamp ? data.timestamp.toDate() : new Date(),
            status: data.status || "completed",
            paymentMethod: data.paymentMethod || "Credit Card",
          })
        })

        // Sort by date (most recent first)
        donationsData.sort((a, b) => b.date.getTime() - a.date.getTime())

        setDonations(donationsData)
        setFilteredDonations(donationsData)
      } catch (error) {
        console.error("Error fetching donations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDonations()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...donations]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (donation) =>
          donation.donorName.toLowerCase().includes(query) || donation.projectName.toLowerCase().includes(query),
      )
    }

    // Apply project filter
    if (projectFilter !== "all") {
      result = result.filter((donation) => donation.projectId === projectFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((donation) => donation.status === statusFilter)
    }

    // Apply date range filter
    if (fromDate) {
      result = result.filter((donation) => donation.date >= fromDate)
    }

    if (toDate) {
      // Add one day to include the end date fully
      const endDate = new Date(toDate)
      endDate.setDate(endDate.getDate() + 1)
      result = result.filter((donation) => donation.date < endDate)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === "donorName" || sortField === "projectName" || sortField === "paymentMethod") {
        comparison = a[sortField].localeCompare(b[sortField])
      } else if (sortField === "date") {
        comparison = a.date.getTime() - b.date.getTime()
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status)
      } else {
        // Handle numeric fields
        comparison = (a[sortField] as number) - (b[sortField] as number)
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredDonations(result)
  }, [donations, searchQuery, projectFilter, statusFilter, fromDate, toDate, sortField, sortDirection])

  const handleSort = (field: keyof Donation) => {
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
    setProjectFilter("all")
    setStatusFilter("all")
    setFromDate(undefined)
    setToDate(undefined)
    setSortField("date")
    setSortDirection("desc")
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <Card className={`shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Recent Donations</h2>
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
                  placeholder="Search donor or project..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : <span>From date</span>}
                      {fromDate && (
                        <Button
                          variant="ghost"
                          className="h-4 w-4 p-0 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setFromDate(undefined)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : <span>To date</span>}
                      {toDate && (
                        <Button
                          variant="ghost"
                          className="h-4 w-4 p-0 ml-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            setToDate(undefined)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("donorName")}
                  >
                    Donor {sortField === "donorName" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("projectName")}
                  >
                    Project {sortField === "projectName" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("amount")}
                  >
                    Amount {sortField === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("date")}
                  >
                    Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("status")}
                  >
                    Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    className="text-left py-3 font-medium cursor-pointer hover:text-blue-600"
                    onClick={() => handleSort("paymentMethod")}
                  >
                    Payment Method {sortField === "paymentMethod" && (sortDirection === "asc" ? "↑" : "↓")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center">
                      Loading donations...
                    </td>
                  </tr>
                ) : filteredDonations.length > 0 ? (
                  filteredDonations.map((donation) => (
                    <tr key={donation.id} className="border-b">
                      <td className="py-3">{donation.donorName}</td>
                      <td className="py-3">{donation.projectName}</td>
                      <td className="py-3">{formatCurrency(donation.amount)}</td>
                      <td className="py-3">{formatDate(donation.date)}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                            donation.status,
                          )}`}
                        >
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3">{donation.paymentMethod}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted-foreground">
                      No donations match your filter criteria
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
