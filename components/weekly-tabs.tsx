"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BlockersAndDelays } from "@/components/blockers-and-delays"
import { ResourceUtilization } from "@/components/resource-utilization"
import { ChangeRequests } from "@/components/change-requests"
import { WeekOutcomes } from "@/components/week-outcomes"
import { ClipboardList, AlertTriangle, BarChart, CheckSquare } from "lucide-react"

interface WeeklyTabsProps {
  projectId: string
}

export function WeeklyTabs({ projectId }: WeeklyTabsProps) {
  return (
    <Tabs defaultValue="change-requests" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="change-requests" className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Change Requests</span>
          <span className="inline sm:hidden">Changes</span>
        </TabsTrigger>
        <TabsTrigger value="blockers-log" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">Blockers Log</span>
          <span className="inline sm:hidden">Blockers</span>
        </TabsTrigger>
        <TabsTrigger value="resource-utilization" className="flex items-center gap-2">
          <BarChart className="h-4 w-4" />
          <span className="hidden sm:inline">Resource Utilization</span>
          <span className="inline sm:hidden">Resources</span>
        </TabsTrigger>
        <TabsTrigger value="week-outcomes" className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Week Outcomes</span>
          <span className="inline sm:hidden">Outcomes</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="change-requests" className="mt-6">
        <ChangeRequests projectId={projectId} />
      </TabsContent>

      <TabsContent value="blockers-log" className="mt-6">
        <BlockersAndDelays projectId={projectId} />
      </TabsContent>

      <TabsContent value="resource-utilization" className="mt-6">
        <ResourceUtilization projectId={projectId} />
      </TabsContent>

      <TabsContent value="week-outcomes" className="mt-6">
        <WeekOutcomes projectId={projectId} />
      </TabsContent>
    </Tabs>
  )
}
