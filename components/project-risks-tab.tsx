"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProject } from "@/services/project-service"
import type { Project, ProjectRisk } from "@/types/project"
import { AddRiskTab } from "./add-risk-tab"
import { RisksListTab } from "./risks-list-tab"
import { RiskMatrixTab } from "./risk-matrix-tab"
import LoadingAnimation from "./loading-animation"

interface ProjectRisksTabProps {
    projectId: string
}

export function ProjectRisksTab({ projectId }: ProjectRisksTabProps) {
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("add-risk")
    const [risks, setRisks] = useState<ProjectRisk[]>([])

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true)
                const projectData = await getProject(projectId)
                setProject(projectData)
                setRisks(projectData?.risks || [])
            } catch (error) {
                console.error("Error fetching project:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProject()
    }, [projectId])

    const handleRiskAdded = (newRisk: ProjectRisk) => {
        setRisks((prevRisks) => [...prevRisks, newRisk])
        setActiveTab("risks-list")
    }

    const handleRiskUpdated = (updatedRisk: ProjectRisk) => {
        setRisks((prevRisks) => prevRisks.map((risk) => (risk.id === updatedRisk.id ? updatedRisk : risk)))
    }

    const handleRiskDeleted = (riskId: string) => {
        setRisks((prevRisks) => prevRisks.filter((risk) => risk.id !== riskId))
    }

    if (loading) {
        return <LoadingAnimation />
    }

    return (
        <div className="w-full bg-[#1a2332] text-white p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4 bg-[#0f172a] border-b border-gray-700 w-full grid grid-cols-3 rounded-none h-auto">
                    <TabsTrigger
                        value="add-risk"
                        className="py-3 px-6 data-[state=active]:bg-[#1a2332] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                    >
                        Add Risk
                    </TabsTrigger>
                    <TabsTrigger
                        value="risks-list"
                        className="py-3 px-6 data-[state=active]:bg-[#1a2332] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                    >
                        Risks List
                    </TabsTrigger>
                    <TabsTrigger
                        value="risk-matrix"
                        className="py-3 px-6 data-[state=active]:bg-[#1a2332] data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none"
                    >
                        Risk Matrix
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="add-risk" className="mt-0">
                    <AddRiskTab projectId={projectId} />
                </TabsContent>
                <TabsContent value="risks-list" className="mt-0">
                    <RisksListTab
                        projectId={projectId}
                        risks={risks}
                        onRiskUpdated={handleRiskUpdated}
                        onRiskDeleted={handleRiskDeleted}
                        activities={project?.activities || []}
                    />
                </TabsContent>
                <TabsContent value="risk-matrix" className="mt-0">
                    <RiskMatrixTab projectId={projectId} risks={risks} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
