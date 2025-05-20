"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2 } from "lucide-react"
import { addCommunicationMedium, deleteCommunicationMedium, getProject } from "@/services/project-service"
import type { CommunicationMedium } from "@/types/project"
import { useToast } from "@/hooks/use-toast"

interface OtherMediumsTabProps {
    projectId: string
    initialMediums?: CommunicationMedium[]
}

export function OtherMediumsTab({ projectId, initialMediums = [] }: OtherMediumsTabProps) {
    const [mediums, setMediums] = useState<CommunicationMedium[]>(initialMediums)
    const [medium, setMedium] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const project = await getProject(projectId)
                if (project && project.communicationMediums) {
                    setMediums(project.communicationMediums)
                }
            } catch (error) {
                console.error("Error fetching project:", error)
            }
        }

        if (initialMediums.length === 0) {
            fetchProject()
        }
    }, [projectId, initialMediums])

    const handleAddMedium = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!medium.trim()) return

        setIsLoading(true)

        try {
            const newMedium = await addCommunicationMedium(projectId, { medium: medium.trim() })
            setMediums([...mediums, newMedium])
            setMedium("")

            toast({
                title: "Medium added",
                description: "Communication medium has been added successfully",
            })
        } catch (error) {
            console.error("Error adding communication medium:", error)
            toast({
                title: "Error",
                description: "Failed to add communication medium",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteMedium = async (id: string) => {
        try {
            await deleteCommunicationMedium(projectId, id)
            setMediums(mediums.filter((m) => m.id !== id))

            toast({
                title: "Medium removed",
                description: "Communication medium has been removed",
            })
        } catch (error) {
            console.error("Error deleting communication medium:", error)
            toast({
                title: "Error",
                description: "Failed to remove communication medium",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Other Communication Mediums</h2>
            </div>

            <form onSubmit={handleAddMedium} className="flex gap-2">
                <div className="flex-1">
                    <label htmlFor="medium" className="block text-sm font-medium mb-1">
                        Communication Medium
                    </label>
                    <Input
                        id="medium"
                        placeholder="e.g. Slack channel, Discord server"
                        value={medium}
                        onChange={(e) => setMedium(e.target.value)}
                    />
                </div>
                <div className="self-end">
                    <Button type="submit" disabled={isLoading || !medium.trim()}>
                        {isLoading ? "Adding..." : "Add"}
                    </Button>
                </div>
            </form>

            {mediums.length > 0 ? (
                <div className="space-y-4 mt-6">
                    <ul className="space-y-2">
                        {mediums.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-md bg-gray-800 dark:bg-gray-800 border border-gray-700"
                            >
                                <span>{item.medium}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteMedium(item.id)}
                                    aria-label="Delete medium"
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">No communication mediums added yet.</div>
            )}
        </div>
    )
}
