"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AddIssueDialog } from "@/components/modals/add-issue-dialog"
import { UpdateIssueDialog } from "@/components/modals/update-issue-dialog"
import type { Issue, IssueFormData } from "@/types/issue"
import { getIssues, createIssue, updateIssue, getImpactAreas } from "@/services/issue-service"
import { getTeamMembers } from "@/services/team-member-service"
import { message } from "antd"
import { LoadingAnimation } from "@/components/loading-animation"
import { Plus } from "lucide-react"
import { DEFAULT_IMPACT_AREAS } from "@/lib/default-data"

export function IssueLog() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [teamMembers, setTeamMembers] = useState<{ id: number; name: string }[]>([])
  const [impactAreas, setImpactAreas] = useState<string[]>(DEFAULT_IMPACT_AREAS)
  const [loading, setLoading] = useState(true)
  const [selectedIssue, setSelectedIssue] = useState<IssueFormData | null>(null)
  const [showUpdateIssueDialog, setShowUpdateIssueDialog] = useState(false)
  const [showAddIssueDialog, setShowAddIssueDialog] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [fetchedIssues, fetchedTeamMembers, fetchedImpactAreas] = await Promise.all([
          getIssues(),
          getTeamMembers(),
          getImpactAreas(),
        ])

        setIssues(fetchedIssues)
        setTeamMembers(
          fetchedTeamMembers.map((member) => ({
            id: member.id || 0,
            name: member.firstName + " " + member.lastName,
          })),
        )
        setImpactAreas(fetchedImpactAreas)
      } catch (error) {
        console.error("Error fetching data:", error)
        message.error("Failed to load issues data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddIssue = async (issueData: IssueFormData) => {
    try {
      const newIssue = await createIssue(issueData)
      setIssues((prev) => [newIssue, ...prev])
      message.success("Issue added successfully")
    } catch (error) {
      console.error("Error adding issue:", error)
      message.error("Failed to add issue")
    }
  }

  const handleAddImpactArea = (area: string) => {
    if (!impactAreas.includes(area)) {
      setImpactAreas((prev) => [...prev, area].sort())
    }
  }

  const prepareUpdateIssue = (issueId: string) => {
    const issue = issues.find((i) => i.id === issueId)
    if (issue) {
      setSelectedIssue({
        id: issue.id,
        dateRaised: issue.dateRaised,
        reportedBy: issue.reportedBy,
        relatedTo: issue.relatedTo,
        description: issue.description,
        severity: issue.severity,
        impactArea: issue.impactArea,
        assignedTo: issue.assignedTo,
        status: issue.status,
        resolution: issue.resolution,
        dateResolved: issue.dateResolved,
        comments: issue.comments,
      })
      setShowUpdateIssueDialog(true)
    }
  }

  const handleUpdateIssue = async (
    id: string,
    status: "Open" | "In Progress" | "Resolved" | "Closed" | "Escalated",
    resolution: string,
    assignedTo: string,
    dateResolved?: Date,
    comments?: string,
  ) => {
    try {
      const updatedIssue = await updateIssue(id, status, resolution, assignedTo, dateResolved, comments)

      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === id ? { ...issue, status, resolution, assignedTo, dateResolved, comments } : issue,
        ),
      )

      message.success("Issue updated successfully")
    } catch (error) {
      console.error("Error updating issue:", error)
      message.error("Failed to update issue")
    }
  }

  const getIssueSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500 hover:bg-red-600"
      case "High":
        return "bg-orange-500 hover:bg-orange-600"
      case "Medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "Low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  const getIssueStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-500 hover:bg-blue-600"
      case "In Progress":
        return "bg-purple-500 hover:bg-purple-600"
      case "Resolved":
        return "bg-green-500 hover:bg-green-600"
      case "Closed":
        return "bg-gray-500 hover:bg-gray-600"
      case "Escalated":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-blue-500 hover:bg-blue-600"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Issue Log</CardTitle>
          <CardDescription>Track and manage project issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <LoadingAnimation />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Issue Log</CardTitle>
            <CardDescription>Track and manage project issues</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowAddIssueDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Issue
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Date Raised
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Reported By
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Description
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Severity
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Impact Area
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Assigned To
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-sm">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {issues.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                        No issues found. Add a new issue to get started.
                      </td>
                    </tr>
                  ) : (
                    issues.map((issue) => (
                      <tr key={issue.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm font-medium">{issue.id}</td>
                        <td className="px-4 py-3 text-sm">{format(new Date(issue.dateRaised), "MMM d, yyyy")}</td>
                        <td className="px-4 py-3 text-sm">{issue.reportedBy}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="max-w-xs truncate">{issue.description}</div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={getIssueSeverityBadgeClass(issue.severity)}>{issue.severity}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant="outline" className="">
                            {issue.impactArea}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">{issue.assignedTo}</td>
                        <td className="px-4 py-3 text-sm">
                          <Badge className={getIssueStatusBadgeClass(issue.status)}>{issue.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Button size="sm" variant="outline" onClick={() => prepareUpdateIssue(issue.id)}>
                            {issue.status === "Open" ? "Update" : issue.status === "In Progress" ? "Resolve" : "View"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Issue Dialog */}
        <AddIssueDialog
          open={showAddIssueDialog}
          onOpenChange={setShowAddIssueDialog}
          onAddIssue={handleAddIssue}
          teamMembers={teamMembers}
          impactAreas={impactAreas}
          onAddImpactArea={handleAddImpactArea}
        />

        {/* Update Issue Dialog */}
        {showUpdateIssueDialog && selectedIssue && (
          <UpdateIssueDialog
            issue={selectedIssue}
            open={showUpdateIssueDialog}
            onOpenChange={setShowUpdateIssueDialog}
            onUpdate={handleUpdateIssue}
            teamMembers={teamMembers}
          />
        )}
      </CardContent>
    </Card>
  )
}
