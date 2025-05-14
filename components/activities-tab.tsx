"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import {
  addProjectActivity,
  updateProjectActivity,
  deleteProjectActivity,
  getProject,
} from "@/services/project-service"
import type { ProjectActivity, ProjectTask, HumanResource, MaterialResource } from "@/types/project"
import { ActivityTasksModal } from "@/components/modals/activity-tasks-modal"

interface ActivitiesTabProps {
  projectId: string
}

export function ActivitiesTab({ projectId }: ActivitiesTabProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [humanResources, setHumanResources] = useState<HumanResource[]>([])
  const [materialResources, setMaterialResources] = useState<MaterialResource[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activityName, setActivityName] = useState("")
  const [activityDescription, setActivityDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<ProjectActivity | null>(null)
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false)

  // Fetch activities when component mounts
  useEffect(() => {
    fetchActivities()
  }, [projectId])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const project = await getProject(projectId)
      setActivities(project.activities || [])
      setTasks(project.tasks || [])
      setHumanResources(project.humanResources || [])
      setMaterialResources(project.materialResources || [])
    } catch (error: any) {
      setError(error.message || "Failed to fetch activities")
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    if (!activityName.trim()) {
      setError("Activity name is required")
      return
    }

    try {
      setLoading(true)
      setError("")

      if (isEditing && currentActivityId) {
        // Update existing activity
        const updatedActivity = await updateProjectActivity(projectId, currentActivityId, {
          name: activityName,
          description: activityDescription,
        })

        // Update local state
        setActivities(activities.map((activity) => (activity.id === currentActivityId ? updatedActivity : activity)))
      } else {
        // Add new activity
        const newActivity = await addProjectActivity(projectId, {
          name: activityName,
          description: activityDescription,
        })

        // Update local state
        setActivities([...activities, newActivity])
      }

      // Reset form
      setActivityName("")
      setActivityDescription("")
      setIsEditing(false)
      setCurrentActivityId(null)
    } catch (error: any) {
      setError(error.message || "Failed to save activity")
    } finally {
      setLoading(false)
    }
  }

  const handleEditActivity = (activity: ProjectActivity) => {
    setActivityName(activity.name)
    setActivityDescription(activity.description)
    setIsEditing(true)
    setCurrentActivityId(activity.id)
  }

  const handleDeleteActivity = async (activityId: string) => {
    // Check if there are tasks associated with this activity
    const tasksWithActivity = tasks.filter((task) => task.activityId === activityId)
    if (tasksWithActivity.length > 0) {
      setError("Cannot delete activity with associated tasks")
      return
    }

    try {
      setLoading(true)
      await deleteProjectActivity(projectId, activityId)
      setActivities(activities.filter((activity) => activity.id !== activityId))
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to delete activity")
    } finally {
      setLoading(false)
    }
  }

  const getTasksCountForActivity = (activityId: string) => {
    return tasks.filter((task) => task.activityId === activityId).length
  }

  const getTotalCostForActivity = (activityId: string) => {
    const activityTasks = tasks.filter((task) => task.activityId === activityId)
    return activityTasks.reduce((total, task) => {
      const taskCost = task.resources.reduce((sum, resource) => sum + resource.totalCost, 0)
      return total + taskCost
    }, 0)
  }

  const getDurationForActivity = (activityId: string) => {
    const activityTasks = tasks.filter((task) => task.activityId === activityId)
    if (activityTasks.length === 0) return 0

    // Sum up the duration of all tasks in this activity
    return activityTasks.reduce((totalDuration, task) => totalDuration + task.duration, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleViewTasks = (activity: ProjectActivity) => {
    setSelectedActivity(activity)
    setIsTasksModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium mb-4">Add New Activity</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="activityName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Name
            </label>
            <input
              type="text"
              id="activityName"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Enter activity name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label
              htmlFor="activityDescription"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="activityDescription"
              value={activityDescription}
              onChange={(e) => setActivityDescription(e.target.value)}
              placeholder="Describe this activity"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button
            onClick={handleAddActivity}
            disabled={loading || !activityName.trim()}
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
                {isEditing ? "Update Activity" : "Add Activity"}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Activities</h3>
        {loading && !activities.length ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="p-4">
                <div className="flex flex-col">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium">{activity.name}</h4>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{activity.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditActivity(activity)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        disabled={loading}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivity(activity.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        disabled={loading}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Tasks:</span>{" "}
                      <span className="font-medium">{getTasksCountForActivity(activity.id)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Duration:</span>{" "}
                      <span className="font-medium">{getDurationForActivity(activity.id)} days</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Cost:</span>{" "}
                      <span className="font-medium">{formatCurrency(getTotalCostForActivity(activity.id))}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleViewTasks(activity)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View Tasks
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No activities found. Add your first activity to get started.
            </p>
          </div>
        )}
      </div>
      <ActivityTasksModal
        isOpen={isTasksModalOpen}
        onClose={() => setIsTasksModalOpen(false)}
        activity={selectedActivity}
        projectId={projectId}
        tasks={tasks}
        humanResources={humanResources}
        materialResources={materialResources}
      />
    </div>
  )
}
