"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { XCircle, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import { AddBlockerDialog } from "@/components/modals/add-blocker-dialog"
import { ResolveBlockerModal } from "@/components/modals/resolve-blocker-modal"
import { getBlockersByStatus, resolveBlocker, reactivateBlocker } from "@/services/blocker-service"
import { getTeamMembers } from "@/services/team-member-service"
import type { Blocker } from "@/types/blocker"
import type { TeamMember } from "@/types/team-member"
import { message } from "antd"

export function BlockersAndDelays() {
  const [activeBlockers, setActiveBlockers] = useState<Blocker[]>([])
  const [resolvedBlockers, setResolvedBlockers] = useState<Blocker[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolutionDialog, setShowResolutionDialog] = useState(false)
  const [selectedBlockerId, setSelectedBlockerId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Get team members without specifying an ownerId
        const members = await getTeamMembers()
        setTeamMembers(members)

        // Only fetch blockers if we successfully got team members
        const [active, resolved] = await Promise.all([getBlockersByStatus("Active"), getBlockersByStatus("Resolved")])

        setActiveBlockers(active)
        setResolvedBlockers(resolved)
      } catch (error: any) {
        console.error("Error fetching blockers:", error)
        message.error(error.message || "Failed to load blockers")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddBlocker = (newBlocker: Blocker) => {
    setActiveBlockers((prev) => [newBlocker, ...prev])
  }

  const prepareResolveBlocker = (blockerId: string) => {
    setSelectedBlockerId(blockerId)
    setShowResolutionDialog(true)
  }

  const handleResolveBlocker = async (blockerId: string, resolutionNotes: string) => {
    try {
      await resolveBlocker(blockerId, resolutionNotes)

      // Find the blocker that was resolved
      const resolvedBlocker = activeBlockers.find((blocker) => blocker.id === blockerId)

      if (resolvedBlocker) {
        // Add to resolved blockers with the resolution notes and date
        setResolvedBlockers((prev) => [
          {
            ...resolvedBlocker,
            status: "Resolved",
            resolutionNotes,
            resolvedDate: new Date(),
          },
          ...prev,
        ])

        // Remove from active blockers
        setActiveBlockers((prev) => prev.filter((blocker) => blocker.id !== blockerId))
      }

      message.success("Blocker resolved successfully")
    } catch (error: any) {
      console.error("Error resolving blocker:", error)
      message.error(error.message || "Failed to resolve blocker")
      throw error // Re-throw to let the modal handle the error state
    }
  }

  const handleReactivateBlocker = async (blockerId: string) => {
    try {
      await reactivateBlocker(blockerId)

      // Find the blocker that was reactivated
      const reactivatedBlocker = resolvedBlockers.find((blocker) => blocker.id === blockerId)

      if (reactivatedBlocker) {
        // Add to active blockers with previouslyResolved flag
        setActiveBlockers((prev) => [
          {
            ...reactivatedBlocker,
            status: "Active",
            resolvedDate: undefined,
            previouslyResolved: true,
          },
          ...prev,
        ])

        // Remove from resolved blockers
        setResolvedBlockers((prev) => prev.filter((blocker) => blocker.id !== blockerId))
      }

      message.success("Blocker reactivated successfully")
    } catch (error: any) {
      console.error("Error reactivating blocker:", error)
      message.error(error.message || "Failed to reactivate blocker")
    }
  }

  const closeResolutionDialog = () => {
    setShowResolutionDialog(false)
    setSelectedBlockerId(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blockers & Announced Delays</CardTitle>
          <CardDescription>Track and manage blockers affecting project progress</CardDescription>
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
            <CardTitle>Blockers & Announced Delays</CardTitle>
            <CardDescription>Track and manage blockers affecting project progress</CardDescription>
          </div>
          <AddBlockerDialog onAddBlocker={handleAddBlocker} teamMembers={teamMembers} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active" className="relative">
              Active Blockers
              {activeBlockers.length > 0 && (
                <Badge className="ml-2 bg-red-500 text-white">{activeBlockers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="relative">
              Resolved Blockers
              {resolvedBlockers.length > 0 && (
                <Badge className="ml-2 bg-green-500 text-white">{resolvedBlockers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeBlockers.length > 0 ? (
              activeBlockers.map((blocker) => (
                <div key={blocker.id} className="border rounded-lg overflow-hidden">
                  <div className="flex items-start gap-4 p-4">
                    {blocker.impact === "High" ? (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h3 className="font-medium">
                            {blocker.title}
                            {blocker.previouslyResolved && (
                              <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                                Reactivated
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">Related to {blocker.relatedTasks}</p>
                        </div>
                        <span
                          className={`text-sm font-medium px-2 py-1 rounded-full self-start ${
                            blocker.impact === "High"
                              ? "text-red-600 bg-red-100"
                              : blocker.impact === "Medium"
                                ? "text-yellow-600 bg-yellow-100"
                                : "text-blue-600 bg-blue-100"
                          }`}
                        >
                          {blocker.impact} Impact
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reported By</p>
                          <p className="text-sm">{blocker.reportedBy}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                          <p className="text-sm">{blocker.assignedTo}</p>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="mt-2">
                        <AccordionItem value="details">
                          <AccordionTrigger className="text-sm py-2">View Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p className="text-sm mt-1">{blocker.description}</p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Impact</p>
                                <p className="text-sm mt-1">{blocker.impactDescription}</p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Resolution Plan</p>
                                <p className="text-sm mt-1">{blocker.resolutionPlan}</p>
                              </div>

                              {blocker.notes && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Notes/Comments</p>
                                  <p className="text-sm mt-1 whitespace-pre-line">{blocker.notes}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="flex justify-between text-sm text-muted-foreground mt-3">
                        <span>Reported: {format(new Date(blocker.reportedDate), "MMM d, yyyy")}</span>
                        <span>
                          Expected Resolution: {format(new Date(blocker.expectedResolutionDate), "MMM d, yyyy")}
                        </span>
                      </div>

                      <div className="mt-3">
                        <Button size="sm" variant="outline" onClick={() => prepareResolveBlocker(blocker.id)}>
                          Resolve Blocker
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active blockers. Great job keeping the project on track!
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedBlockers.length > 0 ? (
              resolvedBlockers.map((blocker) => (
                <div key={blocker.id} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-start gap-4 p-4">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div>
                          <h3 className="font-medium">{blocker.title}</h3>
                          <p className="text-sm text-muted-foreground">Related to {blocker.relatedTasks}</p>
                        </div>
                        <span className="text-sm font-medium px-2 py-1 rounded-full self-start text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900">
                          Resolved
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Reported By</p>
                          <p className="text-sm">{blocker.reportedBy}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Assigned To</p>
                          <p className="text-sm">{blocker.assignedTo}</p>
                        </div>
                      </div>

                      <Accordion type="single" collapsible className="mt-2">
                        <AccordionItem value="details">
                          <AccordionTrigger className="text-sm py-2">View Details</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pt-2">
                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Description</p>
                                <p className="text-sm mt-1">{blocker.description}</p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Impact</p>
                                <p className="text-sm mt-1">{blocker.impactDescription}</p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-muted-foreground">Resolution Plan</p>
                                <p className="text-sm mt-1">{blocker.resolutionPlan}</p>
                              </div>

                              {blocker.resolutionNotes && (
                                <div className="bg-green-50 p-3 rounded-md border border-green-100 dark:bg-green-900/30 dark:border-green-800">
                                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                                    Resolution Notes
                                  </p>
                                  <p className="text-sm mt-1 text-green-800 dark:text-green-300">
                                    {blocker.resolutionNotes}
                                  </p>
                                </div>
                              )}

                              {blocker.notes && (
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Notes/Comments</p>
                                  <p className="text-sm mt-1">{blocker.notes}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      <div className="flex justify-between text-sm text-muted-foreground mt-3">
                        <span>Reported: {format(new Date(blocker.reportedDate), "MMM d, yyyy")}</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          Resolution Date:{" "}
                          {blocker.resolvedDate ? format(new Date(blocker.resolvedDate), "MMM d, yyyy") : "N/A"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/50 dark:hover:text-amber-300"
                          onClick={() => handleReactivateBlocker(blocker.id)}
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                          Log as Blocker
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No resolved blockers yet. When blockers are resolved, they will appear here.
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Use the new ResolveBlockerModal component */}
        <ResolveBlockerModal
          isOpen={showResolutionDialog}
          onClose={closeResolutionDialog}
          blockerId={selectedBlockerId}
          onResolve={handleResolveBlocker}
        />
      </CardContent>
    </Card>
  )
}
