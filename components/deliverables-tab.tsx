"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import {
  getProject,
  addProjectDeliverable,
  updateProjectDeliverable,
  deleteProjectDeliverable,
} from "@/services/project-service"
import type { ProjectDeliverable } from "@/types/project"
import { format } from "date-fns"
import { DatePicker } from "@/components/ui/ant-date-picker"

interface DeliverablesTabProps {
  projectId: string
}

export function DeliverablesTab({ projectId }: DeliverablesTabProps) {
  const [deliverables, setDeliverables] = useState<ProjectDeliverable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [deliverableName, setDeliverableName] = useState("")
  const [deliverableDescription, setDeliverableDescription] = useState("")
  const [deliverableDeadline, setDeliverableDeadline] = useState<Date | undefined>(undefined)
  const [isEditing, setIsEditing] = useState(false)
  const [currentDeliverableId, setCurrentDeliverableId] = useState<string | null>(null)

  // Fetch project data when component mounts
  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      setLoading(true)
      const project = await getProject(projectId)
      setDeliverables(project.deliverables || [])
    } catch (error: any) {
      setError(error.message || "Failed to fetch project data")
    } finally {
      setLoading(false)
    }
  }

  const handleAddDeliverable = async () => {
    if (!deliverableName.trim()) {
      setError("Deliverable name is required")
      return
    }

    if (!deliverableDeadline) {
      setError("Deadline is required")
      return
    }

    try {
      setLoading(true)
      setError("")

      const deadline = deliverableDeadline ? format(deliverableDeadline, "yyyy-MM-dd") : ""

      if (isEditing && currentDeliverableId) {
        // Update existing deliverable
        const updatedDeliverable = await updateProjectDeliverable(projectId, currentDeliverableId, {
          name: deliverableName,
          description: deliverableDescription,
          deadline,
        })

        // Update local state
        setDeliverables(
          deliverables.map((deliverable) =>
            deliverable.id === currentDeliverableId ? updatedDeliverable : deliverable,
          ),
        )
      } else {
        // Add new deliverable
        const newDeliverable = await addProjectDeliverable(projectId, {
          name: deliverableName,
          description: deliverableDescription,
          deadline,
        })

        // Update local state
        setDeliverables([...deliverables, newDeliverable])
      }

      // Reset form
      setDeliverableName("")
      setDeliverableDescription("")
      setDeliverableDeadline(undefined)
      setIsEditing(false)
      setCurrentDeliverableId(null)
    } catch (error: any) {
      setError(error.message || "Failed to save deliverable")
    } finally {
      setLoading(false)
    }
  }

  const handleEditDeliverable = (deliverable: ProjectDeliverable) => {
    setDeliverableName(deliverable.name)
    setDeliverableDescription(deliverable.description)
    setDeliverableDeadline(new Date(deliverable.deadline))
    setIsEditing(true)
    setCurrentDeliverableId(deliverable.id)
  }

  const handleDeleteDeliverable = async (deliverableId: string) => {
    try {
      setLoading(true)
      await deleteProjectDeliverable(projectId, deliverableId)
      setDeliverables(deliverables.filter((deliverable) => deliverable.id !== deliverableId))
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to delete deliverable")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Add New Deliverable</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="deliverableName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Deliverable Name
            </label>
            <input
              type="text"
              id="deliverableName"
              value={deliverableName}
              onChange={(e) => setDeliverableName(e.target.value)}
              placeholder="Enter deliverable name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="deliverableDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="deliverableDescription"
              value={deliverableDescription}
              onChange={(e) => setDeliverableDescription(e.target.value)}
              placeholder="Describe this deliverable"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
            <DatePicker
              date={deliverableDeadline}
              onDateChange={setDeliverableDeadline}
              placeholder="Select deadline"
              className="w-full"
            />
          </div>
          <Button
            onClick={handleAddDeliverable}
            disabled={loading || !deliverableName.trim() || !deliverableDeadline}
            className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                {isEditing ? "Update Deliverable" : "Add Deliverable"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Deliverables</h3>
        {loading && !deliverables.length ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : deliverables.length > 0 ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deliverable Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {deliverables.map((deliverable, index) => (
                  <tr
                    key={deliverable.id}
                    className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                  >
                    <td className="px-4 py-4 whitespace-nowrap font-medium">{deliverable.name}</td>
                    <td className="px-4 py-4">{deliverable.description}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{formatDate(deliverable.deadline)}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditDeliverable(deliverable)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          disabled={loading}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeliverable(deliverable.id)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No deliverables found. Add your first deliverable to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
