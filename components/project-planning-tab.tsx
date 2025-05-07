"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivitiesTab } from "./activities-tab"
import { TasksTab } from "./tasks-tab"
import { DeliverablesTab } from "./deliverables-tab"
import { MilestonesTab } from "./milestones-tab"
import { DecisionGatesTab } from "./decision-gates-tab"
import { GanttChartTab } from "./gantt-chart-tab"

interface ProjectPlanningTabProps {
  projectId: string
}

export function ProjectPlanningTab({ projectId }: ProjectPlanningTabProps) {
  const [activeTab, setActiveTab] = useState("activities")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Project Planning</h2>
        <p className="text-muted-foreground">Plan your project activities, milestones, and schedule.</p>
      </div>

      <Tabs defaultValue="activities" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted/20 p-1 rounded-md">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="activities">Activities</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="decision-gates">Decision Gates</TabsTrigger>
            <TabsTrigger value="gantt-chart">Gantt Chart</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="activities" className="mt-6">
          <ActivitiesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="tasks" className="mt-6">
          <TasksTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <DeliverablesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestonesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="decision-gates" className="mt-6">
          <DecisionGatesTab projectId={projectId} />
        </TabsContent>

        <TabsContent value="gantt-chart" className="mt-6">
          <GanttChartTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
