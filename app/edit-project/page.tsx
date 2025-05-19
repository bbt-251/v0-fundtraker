"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectDefinitionStepper } from "@/components/project-definition-stepper"
import { BusinessDocumentation } from "@/components/business-documentation"
import { HumanResourceTab } from "@/components/human-resource-tab"
import { MaterialResourceTab } from "@/components/material-resource-tab"
import { getProject, updateProject, uploadProjectDocument } from "@/services/project-service"
import type { Project } from "@/types/project"
import { FinancialResourceTab } from "@/components/financial-resource-tab"
import { ProjectPlanningTab } from "@/components/project-planning-tab"
import { ProjectRisksTab } from "@/components/project-risks-tab"
import { ProjectCommunicationTab } from "@/components/project-communication-tab"

export default function EditProjectPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const projectId = searchParams.get("id")
    const { user } = useAuth()

    // State variables
    const [activeTab, setActiveTab] = useState("definition")
    const [activeResourceTab, setActiveResourceTab] = useState("human")
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")
    const [definitionStep, setDefinitionStep] = useState<"project-info" | "documentation">("project-info")
    const [resourceError, setResourceError] = useState(false)

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        scope: "",
        objectives: "",
        location: "",
        category: "technology" as Project["category"],
    })

    // Fetch project data when the component mounts
    useEffect(() => {
        async function fetchProject() {
            if (!user || !projectId) {
                setLoading(false)
                setError("Project ID is missing or you're not logged in")
                return
            }

            try {
                setLoading(true)
                const fetchedProject = await getProject(projectId)

                // Check if the project belongs to the current user
                if (fetchedProject.userId !== user.uid) {
                    router.push("/my-projects")
                    return
                }

                setProject(fetchedProject)
                setFormData({
                    name: fetchedProject.name,
                    scope: fetchedProject.scope,
                    objectives: fetchedProject.objectives,
                    location: fetchedProject.location,
                    category: fetchedProject.category,
                })
            } catch (error: any) {
                setError(error.message || "Failed to fetch project")
            } finally {
                setLoading(false)
            }
        }

        fetchProject()
    }, [user, projectId, router])

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    // Handle project info form submission
    const handleProjectInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name.trim()) {
            setError("Project name is required")
            return
        }

        // Move to documentation step
        setDefinitionStep("documentation")
    }

    // Handle document upload
    const handleUploadFiles = async (files: File[], type: string) => {
        if (!projectId || !user) {
            throw new Error("Project ID is missing or you're not logged in")
        }

        for (const file of files) {
            await uploadProjectDocument(projectId, file, type as "business" | "tax" | "additional")
        }

        // Refresh project data to show new documents
        const updatedProject = await getProject(projectId)
        setProject(updatedProject)
    }

    // Convert project documents to the format needed by the BusinessDocumentation component
    const formattedDocuments =
        project?.documents?.map((doc) => ({
            id: doc.id,
            name: doc.name,
            size: 0, // Size not available in the original data
            type: doc.name.split(".").pop() || "",
            uploadTime: new Date(doc.uploadedAt),
            documentType: doc.type,
            status: "uploaded", // Default status
        })) || []

    // Handle saving all changes
    const handleSaveChanges = async () => {
        if (!user || !projectId) {
            setError("You must be logged in to update a project")
            return
        }

        setSaving(true)
        setError("")

        try {
            // Update project details
            await updateProject(projectId, formData)

            // Navigate back to projects page
            router.push("/my-projects")
        } catch (error: any) {
            setError(error.message || "Failed to update project")
        } finally {
            setSaving(false)
        }
    }

    // Refresh project data
    const refreshProject = async () => {
        if (!projectId) return

        try {
            const updatedProject = await getProject(projectId)
            setProject(updatedProject)
        } catch (error: any) {
            setError(error.message || "Failed to refresh project data")
        }
    }

    const handleResourceError = () => {
        setResourceError(true)
        console.error("Failed to load a resource")
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow mb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link
                            href="/my-projects"
                            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            <ArrowLeft className="h-9 w-5 mr-2" />
                            Back to Projects
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                    {/* Form Header */}
                    <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Edit Project: {project?.name || "Loading..."}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Make changes to your project details, resources, and planning.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error || resourceError ? (
                        <div className="px-8 py-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-600 dark:text-red-400">
                                {error || "Failed to load some resources. Please try refreshing the page."}
                            </p>
                        </div>
                    ) : null}

                    {/* Tabs */}
                    <Tabs defaultValue="definition" value={activeTab} onValueChange={setActiveTab}>
                        <div className="px-8 pt-6 border-b border-gray-200 dark:border-gray-700">
                            <TabsList className="grid grid-cols-5 w-full">
                                <TabsTrigger value="definition" className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    Project Definition
                                </TabsTrigger>
                                <TabsTrigger value="resources" className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                                        <path d="M14 18H4a2 2 0 0 0-2 2"></path>
                                        <path d="M22 18h-10a2 2 0 0 0-2 2"></path>
                                    </svg>
                                    Project Resources
                                </TabsTrigger>
                                <TabsTrigger value="planning" className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                    </svg>
                                    Project Planning
                                </TabsTrigger>
                                <TabsTrigger value="risks" className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    Project Risks
                                </TabsTrigger>
                                <TabsTrigger value="communication" className="flex items-center gap-2">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                    Communication
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="definition" className="px-8 py-6">
                            <ProjectDefinitionStepper currentStep={definitionStep} onStepClick={setDefinitionStep} />

                            {definitionStep === "project-info" ? (
                                <form onSubmit={handleProjectInfoSubmit}>
                                    <div className="space-y-6">
                                        <div>
                                            <label
                                                htmlFor="name"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                            >
                                                Project Name *
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="scope"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                            >
                                                Project Scope *
                                            </label>
                                            <textarea
                                                id="scope"
                                                name="scope"
                                                rows={3}
                                                value={formData.scope}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="objectives"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                            >
                                                Project Objectives *
                                            </label>
                                            <textarea
                                                id="objectives"
                                                name="objectives"
                                                rows={3}
                                                value={formData.objectives}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="location"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                            >
                                                Project Location *
                                            </label>
                                            <input
                                                type="text"
                                                id="location"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="category"
                                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                                            >
                                                Project Category *
                                            </label>
                                            <select
                                                id="category"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                                                required
                                            >
                                                <option value="environment">Environment</option>
                                                <option value="education">Education</option>
                                                <option value="healthcare">Healthcare</option>
                                                <option value="technology">Technology</option>
                                                <option value="agriculture">Agriculture</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <Button type="submit">Next</Button>
                                    </div>
                                </form>
                            ) : (
                                <BusinessDocumentation
                                    onBack={() => setDefinitionStep("project-info")}
                                    onContinue={handleSaveChanges}
                                    projectId={projectId || ""}
                                    existingFiles={formattedDocuments}
                                    onUploadFiles={handleUploadFiles}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="resources" className="px-8 py-6">
                            <div>
                                <h2 className="text-xl font-semibold">Project Resources</h2>
                                <p className="text-muted-foreground">
                                    Define and manage all resources needed for your project including human resources, materials, and
                                    financial resources.
                                </p>
                            </div>

                            <div className="mt-6">
                                <div className="bg-muted/20 p-1 rounded-md">
                                    <div className="grid grid-cols-3 gap-1">
                                        <button
                                            className={`py-2 px-4 rounded-md text-center ${activeResourceTab === "human" ? "bg-background" : ""
                                                }`}
                                            onClick={() => setActiveResourceTab("human")}
                                        >
                                            Human Resource
                                        </button>
                                        <button
                                            className={`py-2 px-4 rounded-md text-center ${activeResourceTab === "material" ? "bg-background" : ""
                                                }`}
                                            onClick={() => setActiveResourceTab("material")}
                                        >
                                            Material Resource
                                        </button>
                                        <button
                                            className={`py-2 px-4 rounded-md text-center ${activeResourceTab === "financial" ? "bg-background" : ""
                                                }`}
                                            onClick={() => setActiveResourceTab("financial")}
                                        >
                                            Financial Resource
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                {activeResourceTab === "human" && (
                                    <HumanResourceTab projectId={projectId || ""} initialResources={project?.humanResources || []} />
                                )}
                                {activeResourceTab === "material" && (
                                    <MaterialResourceTab
                                        projectId={projectId || ""}
                                        initialResources={project?.materialResources || []}
                                    />
                                )}
                                {activeResourceTab === "financial" && (
                                    <FinancialResourceTab
                                        projectId={projectId || ""}
                                        humanResources={project?.humanResources || []}
                                        materialResources={project?.materialResources || []}
                                    />
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="planning" className="px-8 py-6">
                            {projectId && <ProjectPlanningTab projectId={projectId} />}
                        </TabsContent>

                        <TabsContent value="risks" className="px-8 py-6">
                            {projectId && <ProjectRisksTab projectId={projectId} />}
                        </TabsContent>

                        <TabsContent value="communication" className="px-8 py-6">
                            {projectId && <ProjectCommunicationTab projectId={projectId} />}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
