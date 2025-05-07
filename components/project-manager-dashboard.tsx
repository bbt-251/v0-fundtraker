"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Bell, TrendingUp, AlertTriangle, HelpCircle } from "lucide-react"
import { formatDate } from "@/lib/utils/date-utils"

// Mock data for demonstration
const mockData = {
  tasks: { completed: 45, total: 78 },
  queries: { total: 12, pending: 5 },
  issues: { total: 7, lastWeek: 3 },
  risks: { total: 5, highPriority: 2 },
  timeline: [
    { phase: "Design", completion: 75 },
    { phase: "Development", completion: 40 },
    { phase: "Testing", completion: 0 },
    { phase: "Deployment", completion: 0 },
  ],
  resources: [
    { department: "Development", budget: 65, actual: 70, overBudget: true },
    { department: "Design", budget: 20, actual: 15, overBudget: false },
    { department: "QA", budget: 10, actual: 8, overBudget: false },
    { department: "Management", budget: 5, actual: 7, overBudget: true },
  ],
  activities: [
    {
      name: "Research and Analysis",
      completion: 75,
      dueDate: "2025-03-02",
      teamMembers: 3,
    },
    {
      name: "Create User Journey",
      completion: 40,
      dueDate: "2025-03-06",
      teamMembers: 2,
    },
    {
      name: "Define User Persona",
      completion: 20,
      dueDate: "2025-03-12",
      teamMembers: 1,
    },
    {
      name: "UI Prototyping",
      completion: 0,
      dueDate: "2025-03-18",
      teamMembers: 0,
      notStarted: true,
    },
  ],
}

export function ProjectManagerDashboard() {
  const { userProfile } = useAuth()
  const [greeting, setGreeting] = useState("Good day")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good Morning")
    else if (hour < 18) setGreeting("Good Afternoon")
    else setGreeting("Good Evening")
  }, [])

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {userProfile?.firstName || userProfile?.displayName || "Project Manager"}!
        </h1>
        <p className="text-muted-foreground">Track your work, activities, and projects in one place.</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tasks Completed"
          value={`${mockData.tasks.completed}/${mockData.tasks.total}`}
          description={`${Math.round((mockData.tasks.completed / mockData.tasks.total) * 100)}% completion rate`}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Queries"
          value={mockData.queries.total.toString()}
          description={`${mockData.queries.pending} pending responses`}
          icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Open Issues"
          value={mockData.issues.total.toString()}
          description={`${mockData.issues.lastWeek} from last week`}
          icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Active Risks"
          value={mockData.risks.total.toString()}
          description={`${mockData.risks.highPriority} high priority`}
          icon={<Bell className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Project Timeline and Resource Utilization */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Project Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">Gantt chart representation of project schedule</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>

              {mockData.timeline.map((phase, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{phase.phase}</span>
                    <span className="text-sm text-muted-foreground">{phase.completion}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${phase.completion}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resource Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
            <p className="text-sm text-muted-foreground">Total utilization over project cost</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockData.resources.map((resource, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">{resource.department}</span>
                    <span className="text-xs text-muted-foreground">
                      Budget: {resource.budget}% | Actual: {resource.actual}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className={`h-2 rounded-full ${resource.overBudget ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${resource.actual}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-end space-x-4 pt-2">
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-xs text-muted-foreground">Allocated Budget</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Actual Usage</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span className="text-xs text-muted-foreground">Over Budget</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Progress</CardTitle>
          <p className="text-sm text-muted-foreground">Completion level of project activities</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {mockData.activities.map((activity, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-medium">{activity.name}</h4>
                    <p className="text-xs text-muted-foreground">Due: {formatDate(new Date(activity.dueDate))}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{activity.completion}%</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.notStarted
                        ? "Not started"
                        : `${activity.teamMembers} team member${activity.teamMembers !== 1 ? "s" : ""} assigned`}
                    </p>
                  </div>
                </div>
                <Progress value={activity.completion} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string
  value: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
