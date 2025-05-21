"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, Calendar, Briefcase, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTeamMember, deleteTeamMember } from "@/services/team-member-service"
import type { TeamMember } from "@/types/team-member"
import { EditTeamMemberModal } from "@/components/modals/edit-team-member-modal"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

export default function TeamMemberProfilePage() {
    const router = useRouter()
    const params = useParams()
    const { toast } = useToast()
    const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

    // Fetch team member data
    useEffect(() => {
        const fetchTeamMember = async () => {
            if (!params.id) return

            try {
                setIsLoading(true)
                const member = await getTeamMember(params.id as string)
                setTeamMember(member)
            } catch (error) {
                console.error("Error fetching team member:", error)
                toast({
                    title: "Error",
                    description: "Failed to load team member details. Please try again.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchTeamMember()
    }, [params.id, toast])

    // Handle delete team member
    const handleDeleteTeamMember = async () => {
        if (!teamMember) return

        try {
            await deleteTeamMember(teamMember.id)
            toast({
                title: "Success",
                description: "Team member deleted successfully",
            })
            router.push("/team/members")
        } catch (error) {
            console.error("Error deleting team member:", error)
            toast({
                title: "Error",
                description: "Failed to delete team member. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsDeleteDialogOpen(false)
        }
    }

    // Handle edit success
    const handleEditSuccess = async () => {
        if (!teamMember) return

        try {
            const updatedMember = await getTeamMember(teamMember.id)
            setTeamMember(updatedMember)
            toast({
                title: "Success",
                description: "Team member updated successfully",
            })
        } catch (error) {
            console.error("Error refreshing team member data:", error)
        }
    }

    // Function to render working day badges
    const renderWorkingDays = (days: string[]) => {
        return days.map((day) => (
            <Badge key={day} variant="outline" className="mr-1 mb-1">
                {day}
            </Badge>
        ))
    }

    // Function to get employment type display
    const getEmploymentTypeDisplay = (type: string) => {
        switch (type) {
            case "full-time":
                return "FULL-TIME"
            case "part-time":
                return "PART-TIME"
            case "contractor":
                return "CONTRACTOR"
            case "intern":
                return "INTERN"
            default:
                return type.toUpperCase()
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4">Loading team member details...</p>
                </div>
            </div>
        )
    }

    if (!teamMember) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-xl font-semibold">Team member not found</p>
                    <Button className="mt-4" onClick={() => router.push("/team/members")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Team Members
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.push("/team/members")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Team Members
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage
                                    src={teamMember.avatar || "/placeholder.svg"}
                                    alt={`${teamMember.firstName} ${teamMember.lastName}`}
                                />
                                <AvatarFallback className="text-2xl">
                                    {teamMember.firstName.charAt(0)}
                                    {teamMember.lastName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="text-2xl">
                            {teamMember.firstName} {teamMember.lastName}
                        </CardTitle>
                        <p className="text-muted-foreground">{teamMember.role}</p>
                        <Badge
                            className={`mt-2 ${teamMember.employmentType === "full-time"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : teamMember.employmentType === "part-time"
                                        ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                        : teamMember.employmentType === "contractor"
                                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                            : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                                }`}
                        >
                            {getEmploymentTypeDisplay(teamMember.employmentType)}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <Mail className="h-5 w-5 mr-2 text-muted-foreground" />
                                <span>{teamMember.email}</span>
                            </div>
                            <div className="flex items-center">
                                <Phone className="h-5 w-5 mr-2 text-muted-foreground" />
                                <span>{teamMember.phone}</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium mb-1">Working Days</p>
                                    <div className="flex flex-wrap">{renderWorkingDays(teamMember.workingDays)}</div>
                                </div>
                            </div>
                            {teamMember.projectId && (
                                <div className="flex items-center">
                                    <Briefcase className="h-5 w-5 mr-2 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium mb-1">Assigned Project</p>
                                        <Badge variant="secondary">{teamMember.projectId}</Badge>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 space-y-2">
                            <Button className="w-full" onClick={() => setIsEditModalOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                            </Button>
                            <Button variant="destructive" className="w-full" onClick={() => setIsDeleteDialogOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Team Member
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Team Member Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-2">Role Description</h3>
                                <p className="text-muted-foreground">
                                    {teamMember.role} responsible for various tasks and responsibilities within the project team.
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-2">Skills & Expertise</h3>
                                <div className="flex flex-wrap gap-2">
                                    {/* Sample skills based on role */}
                                    {teamMember.role.toLowerCase().includes("developer") && (
                                        <>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">JavaScript</Badge>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">React</Badge>
                                            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Node.js</Badge>
                                        </>
                                    )}
                                    {teamMember.role.toLowerCase().includes("designer") && (
                                        <>
                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">UI Design</Badge>
                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Figma</Badge>
                                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">User Research</Badge>
                                        </>
                                    )}
                                    {teamMember.role.toLowerCase().includes("manager") && (
                                        <>
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Project Management</Badge>
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Team Leadership</Badge>
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Agile</Badge>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-2">Availability</h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                                        <div key={day} className="text-center">
                                            <div className="text-sm font-medium mb-1">{day.substring(0, 3)}</div>
                                            <div
                                                className={`h-8 rounded-md flex items-center justify-center ${teamMember.workingDays.includes(day)
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-gray-100 text-gray-400"
                                                    }`}
                                            >
                                                {teamMember.workingDays.includes(day) ? "Available" : "Off"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium mb-2">Member Since</h3>
                                <p className="text-muted-foreground">
                                    {new Date(teamMember.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            <EditTeamMemberModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                teamMember={teamMember}
                onSuccess={handleEditSuccess}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {teamMember.firstName} {teamMember.lastName}? This action cannot be
                            undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteTeamMember}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
