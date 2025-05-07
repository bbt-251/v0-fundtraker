"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProjectMilestone } from "@/types/project"
import type { MilestoneBudget } from "./financial-resource-tab"

interface MilestoneBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (budgetData: MilestoneBudget) => void
  initialData?: MilestoneBudget
  projectMilestones: ProjectMilestone[]
  totalProjectCost: number
  existingBudgets: MilestoneBudget[]
}

export function MilestoneBudgetModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projectMilestones,
  totalProjectCost,
  existingBudgets,
}: MilestoneBudgetModalProps) {
  const [budgetData, setBudgetData] = useState<MilestoneBudget>({
    id: "",
    milestoneId: "",
    milestoneName: "",
    dueDate: "",
    budget: 0,
    status: "Planned",
  })

  // Initialize form with initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      // Make sure we're preserving the ID when editing
      setBudgetData({
        ...initialData,
        // Ensure these fields are explicitly set
        id: initialData.id,
        milestoneId: initialData.milestoneId,
        milestoneName: initialData.milestoneName,
        dueDate: initialData.dueDate,
        budget: initialData.budget,
        status: initialData.status,
      })
    } else {
      setBudgetData({
        id: "",
        milestoneId: "",
        milestoneName: "",
        dueDate: "",
        budget: 0,
        status: "Planned",
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Always set status to "Planned" before submitting
    onSubmit({ ...budgetData, status: "Planned" })
  }

  const handleMilestoneChange = (milestoneId: string) => {
    const selectedMilestone = projectMilestones.find((milestone) => milestone.id === milestoneId)
    if (selectedMilestone) {
      setBudgetData({
        ...budgetData,
        milestoneId,
        milestoneName: selectedMilestone.name,
        dueDate: selectedMilestone.date,
      })
    }
  }

  // Calculate percentage of total project cost
  const percentOfTotal = totalProjectCost > 0 ? (budgetData.budget / totalProjectCost) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden">
      {/* Modal backdrop - covers the entire screen */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md mx-4 sm:mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="mr-2 p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {initialData ? "Edit Milestone Budget" : "Add Milestone Budget"}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-6">
            {/* Milestone Selection */}
            <div>
              <Label htmlFor="milestone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Milestone
              </Label>
              <Select value={budgetData.milestoneId} onValueChange={handleMilestoneChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  {projectMilestones
                    .filter((milestone) => {
                      // When editing, don't filter out the currently selected milestone
                      if (initialData && milestone.id === initialData.milestoneId) {
                        return true
                      }
                      // Filter out milestones that already have a budget
                      return !existingBudgets.some((budget) => budget.milestoneId === milestone.id)
                    })
                    .map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </SelectItem>
                    ))}
                </SelectContent>
                {projectMilestones.filter(
                  (milestone) =>
                    initialData?.milestoneId === milestone.id ||
                    !existingBudgets.some((budget) => budget.milestoneId === milestone.id),
                ).length === 0 && (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    All milestones already have budgets assigned
                  </div>
                )}
              </Select>
            </div>

            {/* Budget Amount */}
            <div>
              <Label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Budget Amount
              </Label>
              <Input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={budgetData.budget}
                onChange={(e) => setBudgetData({ ...budgetData, budget: Number.parseFloat(e.target.value) || 0 })}
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {percentOfTotal.toFixed(2)}% of total project cost
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                {initialData ? "Update Milestone" : "Add Milestone"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
