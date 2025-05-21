"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Filter, Plus, MoreVertical, Search, CheckCircle2, Users2, Trash2, Edit, Eye, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AddTeamMemberModal } from "@/components/modals/add-team-member-modal"
import { EditTeamMemberModal } from "@/components/modals/edit-team-member-modal"
import { useAuth } from "@/contexts/auth-context"
import { getTeamMembers, deleteTeamMember } from "@/services/team-member-service"
import type { TeamMember } from "@/types/team-member"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function TeamMembersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isEditMemberModalOpen, setIsEditMemberModalOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedTeamMember, setSelectedTeamMember] = useState<TeamMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null)

  // Fetch team members
  const fetchTeamMembers = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const members = await getTeamMembers(user.uid)
      setTeamMembers(members)
    } catch (error) {
      console.error("Error fetching team members:", error)
      toast({
        title: "Error",
        description: "Failed to load team members. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamMembers()
  }, [user])

  // Handle member added success
  const handleMemberAdded = () => {
    fetchTeamMembers()
    setSuccessMessage("Team member added successfully")
    setShowSuccessAlert(true)

    // Hide the alert after 5 seconds
    setTimeout(() => {
      setShowSuccessAlert(false)
    }, 5000)
  }

  // Handle member updated success
  const handleMemberUpdated = () => {
    fetchTeamMembers()
    setSuccessMessage("Team member updated successfully")
    setShowSuccessAlert(true)

    // Hide the alert after 5 seconds
    setTimeout(() => {
      setShowSuccessAlert(false)
    }, 5000)
  }

  // Handle edit member
  const handleEditMember = (member: TeamMember) => {
    setSelectedTeamMember(member)
    setIsEditMemberModalOpen(true)
  }

  // Handle view profile
  const handleViewProfile = (memberId: string) => {
    router.push(`/team/members/${memberId}`)
  }

  // Handle delete member
  const confirmDeleteMember = (id: string) => {
    setMemberToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteMember = async () => {
    if (!memberToDelete) return

    try {
      await deleteTeamMember(memberToDelete)
      setTeamMembers(teamMembers.filter((member) => member.id !== memberToDelete))
      setSuccessMessage("Team member deleted successfully")
      setShowSuccessAlert(true)

      // Hide the alert after 5 seconds
      setTimeout(() => {
        setShowSuccessAlert(false)
      }, 5000)
    } catch (error) {
      console.error("Error deleting team member:", error)
      toast({
        title: "Error",
        description: "Failed to delete team member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteConfirmOpen(false)
      setMemberToDelete(null)
    }
  }

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(filteredMembers.map((member) => member.id))
    } else {
      setSelectedMembers([])
    }
  }

  // Handle select member
  const handleSelectMember = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, id])
    } else {
      setSelectedMembers(selectedMembers.filter((memberId) => memberId !== id))
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
  }

  // Filter team members based on search query
  const filteredMembers = teamMembers.filter((member) => {
    if (!searchQuery.trim()) return true

    const fullName = `${member.firstName} ${member.lastName}`.toLowerCase()
    const query = searchQuery.toLowerCase().trim()

    return fullName.includes(query)
  })

  // Function to render working day circles
  const renderWorkingDays = (days: string[]) => {
    const dayAbbreviations = {
      Monday: "M",
      Tuesday: "T",
      Wednesday: "W",
      Thursday: "T",
      Friday: "F",
      Saturday: "S",
      Sunday: "S",
    }

    const allDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

    return allDays.map((day, index) => {
      const isWorkingDay = days.includes(day)
      return (
        <div
          key={index}
          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
            isWorkingDay ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-400"
          }`}
        >
          {dayAbbreviations[day as keyof typeof dayAbbreviations]}
        </div>
      )
    })
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

  return (
    <div className="flex flex-col">
      <header className="flex h-[5rem] items-center gap-4 border-b bg-background px-6 pt-10 pb-8">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Team Members</h1>
          </div>
          <p className="text-sm text-muted-foreground">Manage your project team members</p>
        </div>
      </header>
      <div className="flex-1 p-6">
        {showSuccessAlert && (
          <div className="mb-6">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <span className="font-semibold">{successMessage}</span>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Users2 className="h-5 w-5 text-gray-500" />
              <span className="text-xl font-medium">{filteredMembers.length}</span>
              <span className="text-sm text-muted-foreground">{searchQuery ? "Matching Members" : "Team Members"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name..."
                className="w-[300px] pl-8"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  onClick={clearSearch}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                    <span className="sr-only">Filter</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Filter team members</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button onClick={() => setIsAddMemberModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <div className="grid grid-cols-[28px_2fr_1.5fr_1.5fr_2fr_1fr_40px] items-center gap-4 border-b p-4 font-medium">
            <Checkbox
              id="select-all"
              checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <div>NAME</div>
            <div>CONTACT</div>
            <div>WORKING DAYS</div>
            <div>ROLE</div>
            <div>TYPE</div>
            <div></div>
          </div>

          {isLoading ? (
            <div className="p-8 text-center">Loading team members...</div>
          ) : filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? (
                <>
                  No team members match your search "{searchQuery}"
                  <div className="mt-2">
                    <Button variant="outline" size="sm" onClick={clearSearch}>
                      Clear Search
                    </Button>
                  </div>
                </>
              ) : (
                "No team members found. Add your first team member!"
              )}
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[28px_2fr_1.5fr_1.5fr_2fr_1fr_40px] items-center gap-4 border-b p-4"
              >
                <Checkbox
                  id={`select-${member.id}`}
                  checked={selectedMembers.includes(member.id)}
                  onCheckedChange={(checked) => handleSelectMember(member.id, !!checked)}
                />
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={member.avatar || "/placeholder.svg"}
                      alt={`${member.firstName} ${member.lastName}`}
                    />
                    <AvatarFallback>
                      {member.firstName.charAt(0)}
                      {member.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{member.role}</div>
                  </div>
                </div>
                <div>
                  <div>{member.phone}</div>
                  <div className="text-sm text-blue-600">{member.email}</div>
                </div>
                <div className="flex gap-1">{renderWorkingDays(member.workingDays)}</div>
                <div>{member.role}</div>
                <div>
                  <Badge
                    variant={member.employmentType === "full-time" ? "default" : "secondary"}
                    className={`
                    ${
                      member.employmentType === "full-time"
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : member.employmentType === "part-time"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : member.employmentType === "contractor"
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            : "bg-purple-100 text-purple-800 hover:bg-purple-100"
                    }
                  `}
                  >
                    {getEmploymentTypeDisplay(member.employmentType)}
                  </Badge>
                </div>
                <div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewProfile(member.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditMember(member)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDeleteMember(member.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Team Member Modal */}
      <AddTeamMemberModal
        open={isAddMemberModalOpen}
        onOpenChange={setIsAddMemberModalOpen}
        onSuccess={handleMemberAdded}
      />

      {/* Edit Team Member Modal */}
      <EditTeamMemberModal
        open={isEditMemberModalOpen}
        onOpenChange={setIsEditMemberModalOpen}
        teamMember={selectedTeamMember}
        onSuccess={handleMemberUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this team member? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteMember}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
