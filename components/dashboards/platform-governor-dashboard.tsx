"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Users, FolderKanban, DollarSign, Loader2 } from "lucide-react"
import { collection, getDocs, query, where, getFirestore } from "firebase/firestore"
import { formatCurrency } from "@/lib/utils/currency-utils"
import { UpcomingDeliverables } from "@/components/upcoming-deliverables"
import type { Project } from "@/types/project"

export default function PlatformGovernorDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalFunds: 0,
    pendingApprovals: 0,
  })
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        setLoading(true)
        const db = getFirestore()

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"))
        const totalUsers = usersSnapshot.size
        const activeUsers = usersSnapshot.docs.filter((doc) => doc.data().verified).length

        // Fetch projects
        const projectsSnapshot = await getDocs(collection(db, "projects"))
        const projectsData = projectsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[]

        setProjects(projectsData)
        const totalProjects = projectsData.length
        const activeProjects = projectsData.filter((doc) => doc.isInExecution).length

        // Calculate total funds (donations)
        const donationsSnapshot = await getDocs(collection(db, "donations"))
        const totalFunds = donationsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0)

        // Fetch pending approvals
        const pendingApprovalsSnapshot = await getDocs(
          query(collection(db, "projects"), where("approvalStatus", "==", "pending")),
        )
        const pendingApprovals = pendingApprovalsSnapshot.size

        setStats({
          totalUsers,
          activeUsers,
          totalProjects,
          activeProjects,
          totalFunds,
          pendingApprovals,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Governor Dashboard</h1>
        <p className="text-muted-foreground">Monitor platform activity and manage users and projects.</p>
      </div>

      {/* Dashboard summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{stats.activeUsers} active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">{stats.activeProjects} active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalFunds)}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">Projects awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional dashboard content can be added here */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent activity to display.</p>
        </CardContent>
      </Card>

      {/* Upcoming Deliverables */}
      <UpcomingDeliverables projects={projects} />
    </div>
  )
}
