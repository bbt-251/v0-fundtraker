"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateCommunicationPlan, getCommunicationPlan } from "@/services/project-service"
import { LoadingAnimation } from "./loading-animation"
import { toast } from "@/components/ui/use-toast"

interface CommunicationPlanTabProps {
  projectId: string
}

interface CommunicationPlan {
  stakeholderStrategy: string
  meetingSchedule: string
  reportingFrequency: string
  feedbackMechanisms: string
  emergencyContacts: string
}

export function CommunicationPlanTab({ projectId }: CommunicationPlanTabProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<CommunicationPlan>({
    stakeholderStrategy: "",
    meetingSchedule: "",
    reportingFrequency: "",
    feedbackMechanisms: "",
    emergencyContacts: "",
  })

  useEffect(() => {
    async function fetchCommunicationPlan() {
      try {
        setLoading(true)
        const plan = await getCommunicationPlan(projectId)
        if (plan) {
          setFormData(plan)
        }
      } catch (error) {
        console.error("Error fetching communication plan:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCommunicationPlan()
  }, [projectId])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await updateCommunicationPlan(projectId, formData)
      toast({
        title: "Success",
        description: "Communication plan saved successfully",
      })
    } catch (error) {
      console.error("Error saving communication plan:", error)
      toast({
        title: "Error",
        description: "Failed to save communication plan",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingAnimation />
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Communication Plan</h3>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="stakeholderStrategy">Stakeholder Communication Strategy</Label>
          <Textarea
            id="stakeholderStrategy"
            name="stakeholderStrategy"
            placeholder="Describe your strategy for communicating with stakeholders"
            value={formData.stakeholderStrategy}
            onChange={handleInputChange}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="meetingSchedule">Meeting Schedule</Label>
          <Textarea
            id="meetingSchedule"
            name="meetingSchedule"
            placeholder="Outline your regular meeting schedule"
            value={formData.meetingSchedule}
            onChange={handleInputChange}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reportingFrequency">Reporting Frequency</Label>
          <Textarea
            id="reportingFrequency"
            name="reportingFrequency"
            placeholder="How often will you report on project progress"
            value={formData.reportingFrequency}
            onChange={handleInputChange}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="feedbackMechanisms">Feedback Mechanisms</Label>
          <Textarea
            id="feedbackMechanisms"
            name="feedbackMechanisms"
            placeholder="How will you collect and process feedback"
            value={formData.feedbackMechanisms}
            onChange={handleInputChange}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContacts">Emergency Contacts</Label>
          <Textarea
            id="emergencyContacts"
            name="emergencyContacts"
            placeholder="List emergency contacts and protocols"
            value={formData.emergencyContacts}
            onChange={handleInputChange}
            rows={4}
            className="resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Communication Plan"}
        </Button>
      </div>
    </div>
  )
}
