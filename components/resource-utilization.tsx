"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency-utils"

interface ResourceUtilizationProps {
    projectId?: string
}

export function ResourceUtilization({ projectId }: ResourceUtilizationProps) {
    const { toast } = useToast()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [humanResourceData, setHumanResourceData] = useState<any[]>([])
    const [materialResourceData, setMaterialResourceData] = useState<any[]>([])
    const [humanResourceCost, setHumanResourceCost] = useState({
        allocated: 0,
        actual: 0,
    })
    const [materialResourceCost, setMaterialResourceCost] = useState({
        allocated: 0,
        actual: 0,
    })

    useEffect(() => {
        // Simulate fetching project data
        const fetchProject = async () => {
            try {
                setLoading(true)
                // Mock data for demonstration
                const mockProject = {
                    id: projectId || "project-1",
                    title: "Healthcare Facility Upgrade",
                    humanResources: [
                        { role: "Project Manager", rate: 50, allocatedHours: 120, actualHours: 130 },
                        { role: "Engineer", rate: 45, allocatedHours: 200, actualHours: 180 },
                        { role: "Medical Consultant", rate: 75, allocatedHours: 80, actualHours: 85 },
                    ],
                    materialResources: [
                        { name: "Medical Equipment", allocatedCost: 15000, actualCost: 16200 },
                        { name: "Construction Materials", allocatedCost: 8000, actualCost: 7500 },
                        { name: "IT Infrastructure", allocatedCost: 5000, actualCost: 5300 },
                    ],
                }

                setProject(mockProject)

                // Calculate human resource costs
                const humanAllocated = mockProject.humanResources.reduce(
                    (sum: number, resource: any) => sum + resource.rate * resource.allocatedHours,
                    0,
                )

                const humanActual = mockProject.humanResources.reduce(
                    (sum: number, resource: any) => sum + resource.rate * resource.actualHours,
                    0,
                )

                setHumanResourceCost({
                    allocated: humanAllocated,
                    actual: humanActual,
                })

                // Calculate material resource costs
                const materialAllocated = mockProject.materialResources.reduce(
                    (sum: number, resource: any) => sum + resource.allocatedCost,
                    0,
                )

                const materialActual = mockProject.materialResources.reduce(
                    (sum: number, resource: any) => sum + resource.actualCost,
                    0,
                )

                setMaterialResourceCost({
                    allocated: materialAllocated,
                    actual: materialActual,
                })

                // Prepare data for display
                setHumanResourceData(
                    mockProject.humanResources.map((resource: any) => ({
                        ...resource,
                        allocatedCost: resource.rate * resource.allocatedHours,
                        actualCost: resource.rate * resource.actualHours,
                        utilizationPercentage: (resource.actualHours / resource.allocatedHours) * 100,
                    })),
                )

                setMaterialResourceData(
                    mockProject.materialResources.map((resource: any) => ({
                        ...resource,
                        utilizationPercentage: (resource.actualCost / resource.allocatedCost) * 100,
                    })),
                )

                setLoading(false)
            } catch (error) {
                console.error("Error fetching project:", error)
                toast({
                    title: "Error",
                    description: "Failed to load resource utilization data",
                    variant: "destructive",
                })
                setLoading(false)
            }
        }

        fetchProject()
    }, [projectId, toast])

    const totalAllocatedCost = humanResourceCost.allocated + materialResourceCost.allocated
    const totalActualCost = humanResourceCost.actual + materialResourceCost.actual
    const totalUtilizationPercentage = totalAllocatedCost > 0 ? (totalActualCost / totalAllocatedCost) * 100 : 0

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Resource Utilization</CardTitle>
                    <CardDescription>Loading resource data...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>Track allocated vs. actual resource usage for the current project</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Overall Resource Utilization */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <h3 className="text-sm font-medium">Overall Resource Utilization</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{totalUtilizationPercentage.toFixed(0)}%</span>
                        </div>
                        <Progress
                            value={totalUtilizationPercentage}
                            className={`h-2 ${totalUtilizationPercentage > 100 ? "bg-red-200" : "bg-gray-200"}`}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-gray-500">Allocated: {formatCurrency(totalAllocatedCost)}</span>
                            <span className={`text-xs ${totalActualCost > totalAllocatedCost ? "text-red-500" : "text-green-500"}`}>
                                Actual: {formatCurrency(totalActualCost)}
                            </span>
                        </div>
                    </div>

                    {/* Human Resources */}
                    <div>
                        <h3 className="text-sm font-medium mb-3">Human Resources</h3>
                        <div className="space-y-3">
                            {humanResourceData.map((resource, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs">{resource.role}</span>
                                        <span className="text-xs text-gray-500">{resource.utilizationPercentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress
                                        value={resource.utilizationPercentage}
                                        className={`h-1.5 ${resource.utilizationPercentage > 100 ? "bg-red-200" : "bg-gray-200"}`}
                                    />
                                    <div className="flex justify-between mt-0.5 text-[10px] text-gray-500">
                                        <span>
                                            {resource.allocatedHours} hrs ({formatCurrency(resource.allocatedCost)})
                                        </span>
                                        <span className={resource.actualHours > resource.allocatedHours ? "text-red-500" : ""}>
                                            {resource.actualHours} hrs ({formatCurrency(resource.actualCost)})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Material Resources */}
                    <div>
                        <h3 className="text-sm font-medium mb-3">Material Resources</h3>
                        <div className="space-y-3">
                            {materialResourceData.map((resource, index) => (
                                <div key={index}>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs">{resource.name}</span>
                                        <span className="text-xs text-gray-500">{resource.utilizationPercentage.toFixed(0)}%</span>
                                    </div>
                                    <Progress
                                        value={resource.utilizationPercentage}
                                        className={`h-1.5 ${resource.utilizationPercentage > 100 ? "bg-red-200" : "bg-gray-200"}`}
                                    />
                                    <div className="flex justify-between mt-0.5 text-[10px] text-gray-500">
                                        <span>{formatCurrency(resource.allocatedCost)}</span>
                                        <span className={resource.actualCost > resource.allocatedCost ? "text-red-500" : ""}>
                                            {formatCurrency(resource.actualCost)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                                <span>Allocated</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                                <span>Under Budget</span>
                            </div>
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                                <span>Over Budget</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
