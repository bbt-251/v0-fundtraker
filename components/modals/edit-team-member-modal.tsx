"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { updateTeamMember } from "@/services/team-member-service"
import type { TeamMember } from "@/types/team-member"
import { Loader2 } from "lucide-react"

interface EditTeamMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teamMember: TeamMember | null
  onSuccess?: () => void
}

export function EditTeamMemberModal({ open, onOpenChange, teamMember, onSuccess }: EditTeamMemberModalProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "",
    employmentType: "full-time",
    workingDays: [],
    projectId: "",
  })

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Populate form data when team member changes
  useEffect(() => {
    if (teamMember) {
      setFormData({
        firstName: teamMember.firstName,
        lastName: teamMember.lastName,
        email: teamMember.email,
        phone: teamMember.phone,
        role: teamMember.role,
        employmentType: teamMember.employmentType,
        workingDays: teamMember.workingDays,
        projectId: teamMember.projectId,
      })
    }
  }, [teamMember])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle select change
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle working days change
  const handleWorkingDayChange = (day: string, checked: boolean) => {
    setFormData((prev) => {
      const currentDays = [...(prev.workingDays || [])]

      if (checked && !currentDays.includes(day)) {
        currentDays.push(day)
      } else if (!checked && currentDays.includes(day)) {
        const index = currentDays.indexOf(day)
        currentDays.splice(index, 1)
      }

      return { ...prev, workingDays: currentDays }
    })

    // Clear error for working days
    if (errors.workingDays) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.workingDays
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required"
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required"
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required"
    }

    if (!formData.role?.trim()) {
      newErrors.role = "Role is required"
    }

    if (!formData.workingDays?.length) {
      newErrors.workingDays = "Select at least one working day"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !teamMember) {
      return
    }

    try {
      setIsSubmitting(true)
      await updateTeamMember(teamMember.id, formData)

      toast({
        title: "Success",
        description: "Team member updated successfully",
      })

      // Close modal and return focus to the document
      handleCloseModal()

      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error updating team member:", error)
      toast({
        title: "Error",
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close with proper focus management
  const handleCloseModal = () => {
    // First close the modal
    onOpenChange(false)

    // Use setTimeout to ensure the modal is fully closed before attempting to focus
    setTimeout(() => {
      // Return focus to the document body
      document.body.focus()

      // Or focus a specific element if needed
      // if (cancelButtonRef.current) {
      //   cancelButtonRef.current.focus()
      // }
    }, 100)
  }

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleInputChange}
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleInputChange}
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone || ""}
                onChange={handleInputChange}
                className={errors.phone ? "border-red-500" : ""}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={formData.role || ""}
                onChange={handleInputChange}
                className={errors.role ? "border-red-500" : ""}
              />
              {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">Employment Type</Label>
              <Select
                value={formData.employmentType || ""}
                onValueChange={(value) => handleSelectChange("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2 sm:gap-4">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <div key={day} className="flex items-center space-x-1 sm:space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={(formData.workingDays || []).includes(day)}
                      onCheckedChange={(checked) => handleWorkingDayChange(day, !!checked)}
                    />
                    <Label htmlFor={`day-${day}`} className="text-xs sm:text-sm font-normal">
                      {day.substring(0, 3)}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.workingDays && <p className="text-xs text-red-500">{errors.workingDays}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Assigned Project (Optional)</Label>
              <Select
                value={formData.projectId || ""}
                onValueChange={(value) => handleSelectChange("projectId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="project1">Website Redesign</SelectItem>
                  <SelectItem value="project2">Mobile App Development</SelectItem>
                  <SelectItem value="project3">Marketing Campaign</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={handleCloseModal} ref={cancelButtonRef}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Team Member"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
