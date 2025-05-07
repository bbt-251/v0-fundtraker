"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, PlusIcon, Trash2 } from "lucide-react"
import { getProject, addProjectRisk } from "@/services/project-service"
import type { ProjectActivity, MitigationAction } from "@/types/project"
import { v4 as uuidv4 } from "uuid"

interface AddRiskTabProps {
  projectId: string
}

export function AddRiskTab({ projectId }: AddRiskTabProps) {
  const [activities, setActivities] = useState<ProjectActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [riskName, setRiskName] = useState("")
  const [description, setDescription] = useState("")
  const [impact, setImpact] = useState("3")
  const [probability, setProbability] = useState("3")
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [associatedActivityIds, setAssociatedActivityIds] = useState<string[]>([])
  const [mitigationActions, setMitigationActions] = useState<MitigationAction[]>([])
  const [newMitigationAction, setNewMitigationAction] = useState("")

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const project = await getProject(projectId)
        if (project) {
          setActivities(project.activities || [])
        }
      } catch (err) {
        console.error("Error fetching project activities:", err)
        setError("Failed to load project activities")
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [projectId])

  const handleAddActivity = () => {
    if (selectedActivity && !associatedActivityIds.includes(selectedActivity)) {
      setAssociatedActivityIds([...associatedActivityIds, selectedActivity])
      setSelectedActivity(null)
    }
  }

  const handleRemoveActivity = (activityId: string) => {
    setAssociatedActivityIds(associatedActivityIds.filter((id) => id !== activityId))
  }

  const handleAddMitigationAction = () => {
    if (newMitigationAction.trim()) {
      const newAction: MitigationAction = {
        id: uuidv4(),
        description: newMitigationAction.trim(),
      }
      setMitigationActions([...mitigationActions, newAction])
      setNewMitigationAction("")
    }
  }

  const handleRemoveMitigationAction = (actionId: string) => {
    setMitigationActions(mitigationActions.filter((action) => action.id !== actionId))
  }

  const resetForm = () => {
    setRiskName("")
    setDescription("")
    setImpact("3")
    setProbability("3")
    setSelectedActivity(null)
    setAssociatedActivityIds([])
    setMitigationActions([])
    setNewMitigationAction("")
    setError(null)
    setSuccess(null)
  }

  const validateForm = () => {
    if (!riskName.trim()) {
      setError("Risk name is required")
      return false
    }
    if (!description.trim()) {
      setError("Description is required")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError(null)

      await addProjectRisk(projectId, {
        name: riskName,
        description,
        impact: Number.parseInt(impact),
        probability: Number.parseInt(probability),
        associatedActivityIds,
        mitigationActions,
      })

      setSuccess("Risk added successfully")
      resetForm()
    } catch (err) {
      console.error("Error adding risk:", err)
      setError("Failed to add risk")
    } finally {
      setLoading(false)
    }
  }

  const getActivityNameById = (activityId: string) => {
    const activity = activities.find((a) => a.id === activityId)
    return activity ? activity.name : "Unknown Activity"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Risk</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="riskName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Risk Name
            </label>
            <Input
              id="riskName"
              value={riskName}
              onChange={(e) => setRiskName(e.target.value)}
              placeholder="Enter risk name"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the risk"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="impact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Impact (1-5)
              </label>
              <Input
                id="impact"
                type="number"
                min="1"
                max="5"
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="probability" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Probability (1-5)
              </label>
              <Input
                id="probability"
                type="number"
                min="1"
                max="5"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Associations</label>
            <div className="flex items-center gap-2 mb-2">
              <Select value={selectedActivity || ""} onValueChange={setSelectedActivity}>
                <SelectTrigger className="flex-grow">
                  <SelectValue placeholder="Activity" />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      {activity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleAddActivity}>
                Add
              </Button>
            </div>
            {associatedActivityIds.length > 0 ? (
              <div className="mt-2 space-y-2">
                {associatedActivityIds.map((activityId) => (
                  <div key={activityId} className="flex items-center justify-between bg-muted p-2 rounded-md">
                    <span>{getActivityNameById(activityId)}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveActivity(activityId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activities associated with this risk</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mitigation Actions</label>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleAddMitigationAction}
                disabled={!newMitigationAction.trim()}
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Action
              </Button>
            </div>
            <div className="mb-2">
              <Input
                value={newMitigationAction}
                onChange={(e) => setNewMitigationAction(e.target.value)}
                placeholder="Describe mitigation action"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMitigationAction.trim()) {
                    e.preventDefault()
                    handleAddMitigationAction()
                  }
                }}
              />
            </div>
            {mitigationActions.length > 0 ? (
              <div className="mt-2 space-y-2">
                {mitigationActions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                    <span className="flex-grow">{action.description}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveMitigationAction(action.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No mitigation actions added yet</p>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusIcon className="mr-2 h-4 w-4" />}
              Add Risk
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
