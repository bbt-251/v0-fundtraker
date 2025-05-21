"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CalendarIcon, Plus } from "lucide-react"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    type TeamMeetingFormData,
    defaultMeetingFormData,
    type MeetingType,
    type MeetingStatus,
} from "@/types/team-meeting"
import { useToast } from "@/hooks/use-toast"

interface AddTeamMeetingDialogProps {
    projectId: string
    onAddMeeting: (projectId: string, meeting: TeamMeetingFormData) => Promise<void>
    trigger?: React.ReactNode
}

export function AddTeamMeetingDialog({ projectId, onAddMeeting, trigger }: AddTeamMeetingDialogProps) {
    const [open, setOpen] = useState(false)
    const [formData, setFormData] = useState<TeamMeetingFormData>({ ...defaultMeetingFormData })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { toast } = useToast()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setFormData((prev) => ({ ...prev, date }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setIsSubmitting(true)
            await onAddMeeting(projectId, formData)
            setFormData({ ...defaultMeetingFormData })
            setOpen(false)
            toast({
                title: "Meeting added",
                description: "The team meeting has been successfully added.",
            })
        } catch (error) {
            console.error("Error adding meeting:", error)
            toast({
                title: "Error",
                description: "Failed to add the team meeting. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setFormData({ ...defaultMeetingFormData })
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                setOpen(newOpen)
                if (!newOpen) resetForm()
            }}
        >
            <DialogTrigger>
                {trigger ? (
                    <div onClick={() => setOpen(true)}>{trigger}</div>
                ) : (
                    <Button size="sm" onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Meeting
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto w-[95vw]">
                <DialogHeader>
                    <DialogTitle>Add New Meeting</DialogTitle>
                    <DialogDescription>Enter the details of the team meeting to record in the weekly log.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Meeting Title</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    placeholder="Weekly Status Meeting"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="meetingType">Meeting Type</Label>
                                <Select
                                    value={formData.meetingType}
                                    onValueChange={(value) => handleSelectChange("meetingType", value as MeetingType)}
                                >
                                    <SelectTrigger id="meetingType">
                                        <SelectValue placeholder="Select meeting type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="status">Status Update</SelectItem>
                                        <SelectItem value="planning">Planning Session</SelectItem>
                                        <SelectItem value="review">Review Meeting</SelectItem>
                                        <SelectItem value="design">Design Review</SelectItem>
                                        <SelectItem value="retro">Retrospective</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.date && "text-muted-foreground",
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={formData.date} onSelect={handleDateChange} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => handleSelectChange("status", value as MeetingStatus)}
                                >
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="location">Location/Link</Label>
                            <Input
                                id="location"
                                name="location"
                                placeholder="Conference Room A or Meeting URL"
                                value={formData.location}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="attendees">Attendees</Label>
                            <Textarea
                                id="attendees"
                                name="attendees"
                                placeholder="Project Manager, Tech Lead, Developers, etc."
                                value={formData.attendees}
                                onChange={handleChange}
                                className="min-h-[60px]"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="absentees">Absentees</Label>
                            <Textarea
                                id="absentees"
                                name="absentees"
                                placeholder="Team members who couldn't attend the meeting"
                                value={formData.absentees}
                                onChange={handleChange}
                                className="min-h-[60px]"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="keyPoints">Key Discussion Points</Label>
                            <Textarea
                                id="keyPoints"
                                name="keyPoints"
                                placeholder="Main topics discussed during the meeting"
                                value={formData.keyPoints}
                                onChange={handleChange}
                                className="min-h-[80px]"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="decisions">Decisions Made</Label>
                            <Textarea
                                id="decisions"
                                name="decisions"
                                placeholder="Important decisions made during the meeting"
                                value={formData.decisions}
                                onChange={handleChange}
                                className="min-h-[80px]"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="actionItems">Action Items</Label>
                            <Textarea
                                id="actionItems"
                                name="actionItems"
                                placeholder="Tasks assigned during the meeting"
                                value={formData.actionItems}
                                onChange={handleChange}
                                className="min-h-[80px]"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="blockers">Blockers/Issues Raised</Label>
                            <Textarea
                                id="blockers"
                                name="blockers"
                                placeholder="Problems or blockers identified during the meeting"
                                value={formData.blockers}
                                onChange={handleChange}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Adding..." : "Add Meeting"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
