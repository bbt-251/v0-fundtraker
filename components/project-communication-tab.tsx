"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CommunicationPlanTab } from "./communication-plan-tab"
import { SocialMediaTab } from "./social-media-tab"
import { OtherMediumsTab } from "./other-mediums-tab"

interface ProjectCommunicationTabProps {
  projectId: string
}

export function ProjectCommunicationTab({ projectId }: ProjectCommunicationTabProps) {
  const [activeTab, setActiveTab] = useState("communication-plan")

  return (
    <div className="space-y-6">
      <Tabs defaultValue="communication-plan" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="communication-plan">Communication Plan</TabsTrigger>
          <TabsTrigger value="social-media">Social Media</TabsTrigger>
          <TabsTrigger value="other-mediums">Other Mediums</TabsTrigger>
        </TabsList>
        <TabsContent value="communication-plan">
          <CommunicationPlanTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="social-media">
          <SocialMediaTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="other-mediums">
          <OtherMediumsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
