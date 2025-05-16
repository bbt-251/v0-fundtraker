"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils/currency-utils"
import {
    Calendar,
    MapPin,
    Edit,
    ExternalLink,
    Info,
    CheckCircle2,
    XCircle,
    AlertCircle,
    ChevronRight,
    PlayCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { Project, ProjectTask } from "@/types/project"
import { Switch } from "@/components/ui/switch"
import { updateProjectStatus } from "@/services/project-service"
import { toast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import dayjs from "dayjs"

interface ProjectCardProps {
    project: Project
    onEdit?: () => void
    showEditButton?: boolean
    onRequestApproval?: (projectId: string) => void
}

// Define interfaces for requirement checking
interface RequirementItem {
    name: string
    met: boolean
    details?: string
}

interface RequirementSection {
    name: string
    items: RequirementItem[]
    allMet: boolean
    progress: number
}

export function ProjectCard({ project, onEdit, showEditButton = false, onRequestApproval }: ProjectCardProps) {
    const router = useRouter()
    const [isHovered, setIsHovered] = useState(false)
    const [isAnnouncedToDonors, setIsAnnouncedToDonors] = useState(project.isAnnouncedToDonors || false)
    const [isInExecution, setIsInExecution] = useState(project.isInExecution || false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [canAnnounce, setCanAnnounce] = useState(false)
    const [canExecute, setCanExecute] = useState(false)
    const [requirementSections, setRequirementSections] = useState<RequirementSection[]>([])
    const [executionRequirements, setExecutionRequirements] = useState<RequirementItem[]>([])
    const [hasBeenApprovedBefore, setHasBeenApprovedBefore] = useState(false)
    const [showRequirementsModal, setShowRequirementsModal] = useState(false)
    const [showExecutionRequirementsModal, setShowExecutionRequirementsModal] = useState(false)
    const [overallProgress, setOverallProgress] = useState(0)
    const [executionProgress, setExecutionProgress] = useState(0)
    const [firstTaskCost, setFirstTaskCost] = useState(0)

    // Check if the project meets all requirements for announcement and execution
    useEffect(() => {
        const checkRequirements = () => {
            // 1. Check Project Definition (including sub-tabs)
            const definitionItems: RequirementItem[] = [
                {
                    name: "Project name",
                    met: Boolean(project.name && project.name.trim() !== ""),
                    details: "Enter a name for your project",
                },
                {
                    name: "Project scope",
                    met: Boolean(project.scope && project.scope.trim() !== ""),
                    details: "Define the scope of your project",
                },
                {
                    name: "Project location",
                    met: Boolean(project.location && project.location.trim() !== ""),
                    details: "Specify the location of your project",
                },
                {
                    name: "Business documentation",
                    met: Boolean(project.documents?.some((doc) => doc.type === "business" && doc.url)),
                    details: "Upload at least one business document (e.g., business plan, proposal)",
                },
                {
                    name: "Tax documentation",
                    met: Boolean(project.documents?.some((doc) => doc.type === "tax" && doc.url)),
                    details: "Upload at least one tax document (e.g., tax ID, exemption certificate)",
                },
            ]

            const definitionMet = definitionItems.filter((item) => item.met).length
            const definitionSection: RequirementSection = {
                name: "Project Definition",
                items: definitionItems,
                allMet: definitionItems.every((item) => item.met),
                progress: Math.round((definitionMet / definitionItems.length) * 100),
            }

            // 2. Check Project Resources (including sub-tabs)
            const resourcesItems: RequirementItem[] = [
                {
                    name: "Human resources",
                    met: Boolean(project.humanResources?.length),
                    details: "Add at least one team member to the project",
                },
                {
                    name: "Material resources",
                    met: Boolean(project.materialResources?.length),
                    details: "Add at least one material resource to the project",
                },
                {
                    name: "Fund accounts",
                    met: Boolean(project.fundAccounts?.length),
                    details: "Set up at least one fund account",
                },
            ]

            const resourcesMet = resourcesItems.filter((item) => item.met).length
            const resourcesSection: RequirementSection = {
                name: "Project Resources",
                items: resourcesItems,
                allMet: resourcesItems.every((item) => item.met),
                progress: Math.round((resourcesMet / resourcesItems.length) * 100),
            }

            // 3. Check Project Planning (including sub-tabs)
            const planningItems: RequirementItem[] = [
                {
                    name: "Activities",
                    met: Boolean(project.activities?.length),
                    details: "Create at least one activity",
                },
                {
                    name: "Tasks",
                    met: Boolean(project.tasks?.length),
                    details: "Create at least one task",
                },
                {
                    name: "Deliverables",
                    met: Boolean(project.deliverables?.length),
                    details: "Define at least one deliverable",
                },
                {
                    name: "Milestones",
                    met: Boolean(project.milestones?.length),
                    details: "Set at least one milestone",
                },
                {
                    name: "Decision gates",
                    met: Boolean(project.decisionGates?.length),
                    details: "Define at least one decision gate",
                },
            ]

            const planningMet = planningItems.filter((item) => item.met).length
            const planningSection: RequirementSection = {
                name: "Project Planning",
                items: planningItems,
                allMet: planningItems.every((item) => item.met),
                progress: Math.round((planningMet / planningItems.length) * 100),
            }

            // 4. Check Project Risks
            const risksItems: RequirementItem[] = [
                {
                    name: "Risk items",
                    met: Boolean(project.risks?.length),
                    details: "Identify at least one project risk",
                },
            ]

            const risksMet = risksItems.filter((item) => item.met).length
            const risksSection: RequirementSection = {
                name: "Project Risks",
                items: risksItems,
                allMet: risksItems.every((item) => item.met),
                progress: Math.round((risksMet / risksItems.length) * 100),
            }

            // 5. Check Project Communication (including sub-tabs)
            const communicationItems: RequirementItem[] = [
                {
                    name: "Communication plan",
                    met: Boolean(
                        project.communicationPlan &&
                        project.communicationPlan.stakeholderStrategy &&
                        project.communicationPlan.meetingSchedule &&
                        project.communicationPlan.reportingFrequency &&
                        project.communicationPlan.feedbackMechanisms &&
                        project.communicationPlan.emergencyContacts,
                    ),
                    details: !project.communicationPlan
                        ? "Communication plan is missing"
                        : !project.communicationPlan.stakeholderStrategy
                            ? "Stakeholder strategy is missing"
                            : !project.communicationPlan.meetingSchedule
                                ? "Meeting schedule is missing"
                                : !project.communicationPlan.reportingFrequency
                                    ? "Reporting frequency is missing"
                                    : !project.communicationPlan.feedbackMechanisms
                                        ? "Feedback mechanisms are missing"
                                        : !project.communicationPlan.emergencyContacts
                                            ? "Emergency contacts are missing"
                                            : undefined,
                },
                {
                    name: "Social media accounts",
                    met: Boolean(project.socialMediaAccounts?.length),
                    details: "Add at least one social media account",
                },
                {
                    name: "Other communication mediums",
                    met: Boolean(project.communicationMediums?.length),
                    details: "Add at least one communication medium",
                },
            ]

            const communicationMet = communicationItems.filter((item) => item.met).length
            const communicationSection: RequirementSection = {
                name: "Project Communication",
                items: communicationItems,
                allMet: communicationItems.every((item) => item.met),
                progress: Math.round((communicationMet / communicationItems.length) * 100),
            }

            // Combine all sections
            const allSections = [definitionSection, resourcesSection, planningSection, risksSection, communicationSection]

            setRequirementSections(allSections)

            // Calculate overall progress
            const totalItems = allSections.reduce((acc, section) => acc + section.items.length, 0)
            const totalMet = allSections.reduce((acc, section) => acc + section.items.filter((item) => item.met).length, 0)
            setOverallProgress(Math.round((totalMet / totalItems) * 100))

            // Check if project has been approved before
            const wasApproved = project.approvalStatus === "approved"
            setHasBeenApprovedBefore(wasApproved)

            // Can announce if all requirements are met AND (has been approved before OR is currently approved)
            const allRequirementsMet = allSections.every((section) => section.allMet)
            setCanAnnounce(allRequirementsMet && (wasApproved || project.approvalStatus === "approved"))

            // Check execution requirements
            // 1. Find the first task (by start date)
            let firstTask: ProjectTask | null = null
            let totalFirstTaskCost = 0

            if (project.tasks && project.tasks.length > 0) {
                // Sort tasks by start date
                const sortedTasks = [...project.tasks].sort((a, b) => {
                    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                })

                firstTask = sortedTasks[0]

                // Calculate the cost of the first task
                if (firstTask && firstTask.resources) {
                    totalFirstTaskCost = firstTask.resources.reduce((sum, resource) => sum + resource.totalCost, 0)
                }
            }

            setFirstTaskCost(totalFirstTaskCost)

            // Define execution requirements
            const executionItems: RequirementItem[] = [
                {
                    name: "Project is announced to donors",
                    met: Boolean(project.isAnnouncedToDonors),
                    details: "Project must be announced to donors before execution can begin",
                },
                {
                    name: "Sufficient funding for first task",
                    met: Boolean(project.donations && project.donations >= totalFirstTaskCost && totalFirstTaskCost > 0),
                    details: `Project needs at least ${formatCurrency(
                        totalFirstTaskCost,
                    )} in donations to cover the first task (current: ${formatCurrency(project.donations || 0)})`,
                },
            ]

            setExecutionRequirements(executionItems)

            // Calculate execution requirements progress
            const executionMet = executionItems.filter((item) => item.met).length
            setExecutionProgress(Math.round((executionMet / executionItems.length) * 100))

            // Can execute if all execution requirements are met
            setCanExecute(executionItems.every((item) => item.met))
        }

        checkRequirements()
    }, [project])

    const handleViewDetails = () => {
        router.push(`/project-details/${project.id}`)
    }

    // Calculate progress percentage
    const calculateProgress = () => {
        if (!project.cost || project.cost === 0) return 0
        const donations = project.donations || 0
        return Math.min(Math.round((donations / project.cost) * 100), 100)
    }

    // Get category image
    const getCategoryImage = (category: string) => {
        const categoryImages: Record<string, string> = {
            environment: "/serene-mountain-lake.png",
            education: "/education-books.png",
            healthcare: "/interconnected-healthcare.png",
            technology: "/digital-technology.png",
            agriculture: "/agriculture-farm.png",
            other: "/collaborative-business-project.png",
        }
        return categoryImages[category.toLowerCase()] || categoryImages.other
    }

    // Format date
    const formatDate = (dateString: any) => {
        if (!dateString) return "N/A";

        // Check if the dateString is a Firebase Timestamp
        if (dateString.toDate) {
            return dayjs(dateString.toDate()).format("MMMM DD, YYYY"); // Convert Firebase Timestamp to formatted date
        }

        // Otherwise, assume it's a standard ISO string or Date
        return dayjs(dateString).format("MMMM DD, YYYY");
    };

    // Handle toggle for project announcement
    const handleAnnouncementToggle = async () => {
        // If missing requirements, show the modal
        if (!canAnnounce) {
            setShowRequirementsModal(true)
            return
        }

        // If it's the first time announcing and not yet approved, request approval
        if (!isAnnouncedToDonors && !hasBeenApprovedBefore && project.approvalStatus !== "approved") {
            if (onRequestApproval) {
                onRequestApproval(project.id)
            } else {
                toast({
                    title: "Approval Required",
                    description: "This project needs to be approved by a platform governor before it can be announced to donors.",
                    variant: "destructive",
                })
            }
            return
        }

        // If all requirements are met and (already approved or has been approved before), proceed with toggle
        if (canAnnounce) {
            try {
                setIsUpdating(true)
                const newValue = !isAnnouncedToDonors
                await updateProjectStatus(project.id, newValue, isInExecution)
                setIsAnnouncedToDonors(newValue)
                toast({
                    title: newValue ? "Project announced to donors" : "Project announcement removed",
                    description: newValue
                        ? "The project is now visible to potential donors"
                        : "The project is now hidden from potential donors",
                })
            } catch (error) {
                console.error("Error updating project announcement status:", error)
                toast({
                    title: "Error",
                    description: "Failed to update project announcement status",
                    variant: "destructive",
                })
            } finally {
                setIsUpdating(false)
            }
        }
    }

    // Handle toggle for project execution
    const handleExecutionToggle = async () => {
        // If missing execution requirements, show the modal
        if (!canExecute) {
            setShowExecutionRequirementsModal(true)
            return
        }

        try {
            setIsUpdating(true)
            const newValue = !isInExecution
            await updateProjectStatus(project.id, isAnnouncedToDonors, newValue)
            setIsInExecution(newValue)
            toast({
                title: newValue ? "Project execution started" : "Project execution paused",
                description: newValue ? "The project is now in execution phase" : "The project execution has been paused",
            })
        } catch (error) {
            console.error("Error updating project execution status:", error)
            toast({
                title: "Error",
                description: "Failed to update project execution status",
                variant: "destructive",
            })
        } finally {
            setIsUpdating(false)
        }
    }

    // Get announcement toggle status message
    const getAnnouncementStatusMessage = () => {
        if (!canAnnounce) {
            return `${overallProgress}% complete`
        }

        if (!hasBeenApprovedBefore && project.approvalStatus !== "approved") {
            return "Needs approval"
        }

        return isAnnouncedToDonors ? "Visible to donors" : "Hidden from donors"
    }

    // Get execution toggle status message
    const getExecutionStatusMessage = () => {
        if (!canExecute) {
            return `${executionProgress}% complete`
        }

        return isInExecution ? "In progress" : "Not started"
    }

    // Navigate to edit section
    const navigateToEditSection = (section: string) => {
        if (onEdit) {
            onEdit()
            // Close the modal
            setShowRequirementsModal(false)

            // We would ideally navigate to the specific section here
            // This would require additional routing logic to be implemented
            toast({
                title: `Navigating to ${section}`,
                description: `Please complete the missing items in the ${section.toLowerCase()} section.`,
            })
        }
    }

    const progress = calculateProgress()

    return (
        <>
            <Card
                className="overflow-hidden transition-all duration-300 hover:shadow-lg"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="h-48 overflow-hidden relative">
                    <img
                        src={getCategoryImage(project.category || "other")}
                        alt={project.name}
                        className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? "scale-110" : "scale-100"
                            }`}
                    />
                    <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-white/90 text-gray-800">
                            {project.category || "Other"}
                        </Badge>
                    </div>
                </div>

                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold line-clamp-1">{project.name}</h3>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{project.location || "Unknown location"}</span>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Created: {formatDate(project.createdAt)}</span>
                    </div>
                </CardHeader>

                <CardContent className="pb-3">
                    <div className="mt-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span>Funding Progress</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Raised: {formatCurrency(project.donations || 0)}</span>
                            <span>Goal: {formatCurrency(project.cost || 0)}</span>
                        </div>
                    </div>

                    {showEditButton && (
                        <div className="mt-4 space-y-3 border-t pt-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium">Announce to donors</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    className="ml-1 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setShowRequirementsModal(true)
                                                    }}
                                                >
                                                    <Info className="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Click for announcement requirements</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xs text-muted-foreground mr-2">{getAnnouncementStatusMessage()}</span>
                                    <Switch
                                        checked={isAnnouncedToDonors}
                                        onCheckedChange={handleAnnouncementToggle}
                                        disabled={isUpdating}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium">In execution</span>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    className="ml-1 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                        setShowExecutionRequirementsModal(true)
                                                    }}
                                                >
                                                    <Info className="h-4 w-4" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Click for execution requirements</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xs text-muted-foreground mr-2">{getExecutionStatusMessage()}</span>
                                    <Switch checked={isInExecution} onCheckedChange={handleExecutionToggle} disabled={isUpdating} />
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="pt-0 flex gap-2">
                    {showEditButton && (
                        <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Button>
                    )}
                    <Button size="sm" className="flex-1" onClick={handleViewDetails}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                    </Button>
                </CardFooter>
            </Card>

            {/* Requirements Modal */}
            <Dialog open={showRequirementsModal} onOpenChange={setShowRequirementsModal}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Project Announcement Requirements</DialogTitle>
                        <DialogDescription>
                            Before announcing your project to donors, please complete all required sections.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-6">
                        {/* Overall Progress */}
                        <div className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">Overall Completion</h3>
                                <span className="text-sm font-medium">{overallProgress}%</span>
                            </div>
                            <Progress value={overallProgress} className="h-2" />

                            {!canAnnounce && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Complete all required items below to announce your project to donors.
                                </p>
                            )}

                            {canAnnounce && !hasBeenApprovedBefore && project.approvalStatus !== "approved" && (
                                <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-md">
                                    <div className="flex items-start">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Approval Required</p>
                                            <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                                                All requirements are met, but this project needs platform governor approval before its first
                                                announcement.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Detailed Requirements */}
                        <div className="space-y-6">
                            {requirementSections.map((section, sectionIndex) => (
                                <div
                                    key={sectionIndex}
                                    className={`border rounded-lg overflow-hidden ${section.allMet ? "border-green-200 dark:border-green-800" : "border-muted dark:border-muted"
                                        }`}
                                >
                                    <div
                                        className={`p-4 flex justify-between items-center ${section.allMet ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/30 dark:bg-muted/20"
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            {section.allMet ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500 mr-2" />
                                            ) : (
                                                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2" />
                                            )}
                                            <h3
                                                className={`font-medium ${section.allMet ? "text-green-800 dark:text-green-400" : "text-foreground"
                                                    }`}
                                            >
                                                {section.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center">
                                            <span
                                                className={`text-sm font-medium mr-3 ${section.allMet ? "text-green-700 dark:text-green-500" : "text-muted-foreground"
                                                    }`}
                                            >
                                                {section.progress}%
                                            </span>
                                            {!section.allMet && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs h-8"
                                                    onClick={() => navigateToEditSection(section.name)}
                                                >
                                                    Complete
                                                    <ChevronRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="divide-y divide-border">
                                        {section.items.map((item, itemIndex) => (
                                            <div key={itemIndex} className="p-3 flex items-start">
                                                <div className="mt-0.5 mr-3">
                                                    {item.met ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p
                                                        className={`text-sm font-medium ${item.met ? "text-muted-foreground" : "text-foreground"}`}
                                                    >
                                                        {item.name}
                                                    </p>
                                                    {!item.met && item.details && (
                                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.details}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                            <Button variant="outline" onClick={() => setShowRequirementsModal(false)}>
                                Close
                            </Button>
                            {!canAnnounce && <Button onClick={onEdit}>Edit Project</Button>}
                            {canAnnounce && !hasBeenApprovedBefore && project.approvalStatus !== "approved" && onRequestApproval && (
                                <Button
                                    onClick={() => {
                                        onRequestApproval(project.id)
                                        setShowRequirementsModal(false)
                                    }}
                                >
                                    Request Approval
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Execution Requirements Modal */}
            <Dialog open={showExecutionRequirementsModal} onOpenChange={setShowExecutionRequirementsModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Project Execution Requirements</DialogTitle>
                        <DialogDescription>
                            Before starting project execution, please ensure the following requirements are met.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-6">
                        {/* Execution Progress */}
                        <div className="bg-muted/30 dark:bg-muted/20 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium">Execution Readiness</h3>
                                <span className="text-sm font-medium">{executionProgress}%</span>
                            </div>
                            <Progress value={executionProgress} className="h-2" />

                            {!canExecute && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    Complete all required items below to start project execution.
                                </p>
                            )}
                        </div>

                        {/* Execution Requirements */}
                        <div
                            className={`border rounded-lg overflow-hidden ${canExecute ? "border-green-200 dark:border-green-800" : "border-muted dark:border-muted"
                                }`}
                        >
                            <div
                                className={`p-4 flex justify-between items-center ${canExecute ? "bg-green-50 dark:bg-green-900/20" : "bg-muted/30 dark:bg-muted/20"
                                    }`}
                            >
                                <div className="flex items-center">
                                    {canExecute ? (
                                        <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-500 mr-2" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2" />
                                    )}
                                    <h3
                                        className={`font-medium ${canExecute ? "text-green-800 dark:text-green-400" : "text-foreground"}`}
                                    >
                                        Execution Requirements
                                    </h3>
                                </div>
                            </div>

                            <div className="divide-y divide-border">
                                {executionRequirements.map((item, itemIndex) => (
                                    <div key={itemIndex} className="p-3 flex items-start">
                                        <div className="mt-0.5 mr-3">
                                            {item.met ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 dark:text-green-400" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-medium ${item.met ? "text-muted-foreground" : "text-foreground"}`}>
                                                {item.name}
                                            </p>
                                            {!item.met && item.details && (
                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{item.details}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* First Task Information */}
                        {firstTaskCost > 0 && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">First Task Funding</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                                    Your first task requires {formatCurrency(firstTaskCost)} in funding before execution can begin.
                                </p>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Funding Progress</span>
                                    <span>
                                        {project.donations && firstTaskCost
                                            ? Math.min(Math.round((project.donations / firstTaskCost) * 100), 100)
                                            : 0}
                                        %
                                    </span>
                                </div>
                                <Progress
                                    value={
                                        project.donations && firstTaskCost
                                            ? Math.min(Math.round((project.donations / firstTaskCost) * 100), 100)
                                            : 0
                                    }
                                    className="h-2"
                                />
                                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-500 mt-1">
                                    <span>Current: {formatCurrency(project.donations || 0)}</span>
                                    <span>Needed: {formatCurrency(firstTaskCost)}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                            <Button variant="outline" onClick={() => setShowExecutionRequirementsModal(false)}>
                                Close
                            </Button>
                            {!executionRequirements[0]?.met && (
                                <Button
                                    onClick={() => {
                                        setShowExecutionRequirementsModal(false)
                                        setShowRequirementsModal(true)
                                    }}
                                >
                                    View Announcement Requirements
                                </Button>
                            )}
                            {executionRequirements[0]?.met && !executionRequirements[1]?.met && (
                                <Button onClick={() => router.push(`/project-details/${project.id}`)}>View Project Details</Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
