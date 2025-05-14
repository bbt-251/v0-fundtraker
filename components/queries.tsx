"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddQueryDialog } from "@/components/modals/add-query-dialog"
import { RespondQueryDialog } from "@/components/modals/respond-query-dialog"
import { getQueries, respondToQuery } from "@/services/query-service"
import { getTeamMembers } from "@/services/team-member-service"
import { message } from "antd"
import type { Query, QueryStatus } from "@/types/query"
import type { TeamMember } from "@/types/team-member"
import { useAuth } from "@/contexts/auth-context"

interface QueriesProps {
  projectId?: string
}

export function Queries({ projectId }: QueriesProps) {
  const [queries, setQueries] = useState<Query[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null)
  const [showRespondDialog, setShowRespondDialog] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Get team members
        const members = await getTeamMembers()
        setTeamMembers(members)

        // Get queries
        const fetchedQueries = await getQueries(projectId)
        setQueries(fetchedQueries)
      } catch (error: any) {
        console.error("Error fetching queries:", error)
        message.error(error.message || "Failed to load queries")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [projectId])

  const handleAddQuery = (newQuery: Query) => {
    setQueries((prev) => [newQuery, ...prev])
  }

  const handleRespond = (query: Query) => {
    console.log("Responding to query:", query)
    setSelectedQuery(query)
    setShowRespondDialog(true)
  }

  const handleRespondSubmit = async (id: string, responseText: string, status: QueryStatus, dateResolved?: Date) => {
    try {
      console.log(`Submitting response for query ${id}:`, { responseText, status, dateResolved })
      await respondToQuery(id, responseText, status, dateResolved)

      // Update the query in the local state
      setQueries((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                status,
                response: responseText,
                dateResolved,
                responseDate: new Date(),
              }
            : q,
        ),
      )

      message.success("Response submitted successfully")
    } catch (error: any) {
      console.error("Error responding to query:", error)
      message.error(error.message || "Failed to respond to query")
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "Responded":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "Resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "Escalated":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "Task":
        return "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      case "Decision":
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
      case "Blocker":
        return "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      case "General":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
      case "Process":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queries</CardTitle>
          <CardDescription>Track questions and information requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <CardTitle>Queries</CardTitle>
            <CardDescription>Track questions and information requests</CardDescription>
          </div>
          <AddQueryDialog onAddQuery={handleAddQuery} teamMembers={teamMembers} projectId={projectId} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-sm">ID</th>
                <th className="text-left py-3 px-4 font-medium text-sm">DATE RAISED</th>
                <th className="text-left py-3 px-4 font-medium text-sm">RAISED BY</th>
                <th className="text-left py-3 px-4 font-medium text-sm">RELATED TO</th>
                <th className="text-left py-3 px-4 font-medium text-sm">DESCRIPTION</th>
                <th className="text-left py-3 px-4 font-medium text-sm">CATEGORY</th>
                <th className="text-left py-3 px-4 font-medium text-sm">ASSIGNED TO</th>
                <th className="text-left py-3 px-4 font-medium text-sm">STATUS</th>
                <th className="text-left py-3 px-4 font-medium text-sm">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {queries.length > 0 ? (
                queries.map((query) => (
                  <tr key={query.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-sm">{query.id}</td>
                    <td className="py-3 px-4 text-sm">
                      {typeof query.dateRaised === "string"
                        ? query.dateRaised
                        : format(new Date(query.dateRaised), "MMM d, yyyy")}
                    </td>
                    <td className="py-3 px-4 text-sm">{query.raisedBy}</td>
                    <td className="py-3 px-4 text-sm">{query.relatedTo}</td>
                    <td className="py-3 px-4 text-sm max-w-xs truncate">{query.description}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadgeClass(query.category)}`}
                      >
                        {query.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{query.assignedTo}</td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(query.status)}`}
                      >
                        {query.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {query.status === "Open" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => handleRespond(query)}
                        >
                          Respond
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={() => handleRespond(query)}
                        >
                          View
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No queries found. Add a new query to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {selectedQuery && (
          <RespondQueryDialog
            query={selectedQuery}
            open={showRespondDialog}
            onOpenChange={setShowRespondDialog}
            onRespond={handleRespondSubmit}
          />
        )}
      </CardContent>
    </Card>
  )
}
