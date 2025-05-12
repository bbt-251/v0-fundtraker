"use client"
import { useState, useEffect } from "react"
import { getProject } from "@/services/project-service"
import type { Project, ProjectActivity,ProjectTask,ProjectDeliverable,DecisionGate} from "@/types/project";
import { LoadingAnimation } from "@/components/loading-animation"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
} from "chart.js"
import "chartjs-adapter-date-fns"
import { parseISO, differenceInDays } from "date-fns"
import GanttChart from "./ui/ganttChart"
import { ActivityDetailModal } from "./modals/activity-detail-modal"
import { TaskDetailModal } from "./modals/task-detail-modal"
import { DecisionGateDetailModal } from "./modals/decision-gate-detail-modal"
import { DeliverableDetailModal } from "./modals/deliverable-detail-modal"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, TimeScale)

interface GanttChartTabProps {
  projectId: string
}

interface GanttItem {
  id: string
  name: string
  type: "activity" | "task" | "milestone"
  startDate: Date
  endDate: Date
  duration: number
  activityId?: string
  parentName?: string
}

export function GanttChartTab({ projectId }: GanttChartTabProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([])
  const [selectedActivity, setSelectedActivity] = useState<ProjectActivity | null>(null)
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null)
  const [selectedDeliverable, setSelectedDeliverable] = useState<ProjectDeliverable | null>(null)
  const [selectedDecisionGate, setSelectedDecisionGate] = useState<DecisionGate | null>(null)
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false)
  const [taskModalOpen, setTaskModalOpen] = useState<boolean>(false)
  const [deliverableModalOpen, setDeliverableModalOpen] = useState<boolean>(false)
  const [decisionGateModalOpen, setDecisionGateModalOpen] = useState<boolean>(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true)
        const projectData = await getProject(projectId)
        if (projectData) {
          setProject(projectData)
          processProjectData(projectData)
        } else {
          setError("Project not found")
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project data")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const processProjectData = (project: Project) => {
    const items: GanttItem[] = []
    let earliestDate = new Date()
    let latestDate = new Date()
    let hasSetDates = false

    // Process activities
    if (project.activities && project.activities.length > 0) {
      // Find earliest and latest dates from tasks
      project.tasks.forEach((task) => {
        const startDate = parseISO(task.startDate)
        const endDate = parseISO(task.endDate)

        if (!hasSetDates) {
          earliestDate = startDate
          latestDate = endDate
          hasSetDates = true
        } else {
          if (startDate < earliestDate) earliestDate = startDate
          if (endDate > latestDate) latestDate = endDate
        }
      })

      // Add activities
      project.activities.forEach((activity, index) => {
        // Find all tasks for this activity
        const activityTasks = project.tasks.filter((task) => task.activityId === activity.id)

        if (activityTasks.length > 0) {
          // Calculate activity start and end dates based on its tasks
          const taskStartDates = activityTasks.map((task) => parseISO(task.startDate))
          const taskEndDates = activityTasks.map((task) => parseISO(task.endDate))

          const activityStartDate = new Date(Math.min(...taskStartDates.map((date) => date.getTime())))
          const activityEndDate = new Date(Math.max(...taskEndDates.map((date) => date.getTime())))

          const duration = differenceInDays(activityEndDate, activityStartDate) + 1

          items.push({
            id: activity.id,
            name: `Activity ${index + 1}: ${activity.name}`,
            type: "activity",
            startDate: activityStartDate,
            endDate: activityEndDate,
            duration,
          })
        }
      })

      // Add tasks
      project.tasks.forEach((task, index) => {
        const startDate = parseISO(task.startDate)
        const endDate = parseISO(task.endDate)
        const duration = differenceInDays(endDate, startDate) + 1

        // Find parent activity
        const parentActivity = project.activities.find((a) => a.id === task.activityId)
        const parentName = parentActivity ? parentActivity.name : "Unknown Activity"

        items.push({
          id: task.id,
          name: `Task ${index + 1}: ${task.name}`,
          type: "task",
          startDate,
          endDate,
          duration,
          activityId: task.activityId,
          parentName,
        })
      })
    }

    setGanttItems(items)
  }

  const handleElementClick = (task: any) => {
    // Reset all selections
    setSelectedActivity(null)
    setSelectedTask(null)
    setSelectedDeliverable(null)
    setSelectedDecisionGate(null)

    // Close all modals
    setActivityModalOpen(false)
    setTaskModalOpen(false)
    setDeliverableModalOpen(false)
    setDecisionGateModalOpen(false)

    // Handle based on type
    if (task.type === "project") {
      // Find the activity
      const activity = project?.activities.find((a) => a.id === task.id)
      if (activity) {
        setSelectedActivity(activity)
        setActivityModalOpen(true)
      }
    } else if (task.type === "task") {
      // Find the task
      const projectTask = project?.tasks.find((t) => t.id === task.id)
      if (projectTask) {
        setSelectedTask(projectTask)
        setTaskModalOpen(true)
      }
    } else if (task.type === "milestone") {
      // Check if it's a deliverable or decision gate
      const deliverable = project?.deliverables.find((d) => d.id === task.id)
      if (deliverable) {
        setSelectedDeliverable(deliverable)
        setDeliverableModalOpen(true)
        return
      }

      const decisionGate = project?.decisionGates?.find((dg) => dg.id === task.id)
      if (decisionGate) {
        setSelectedDecisionGate(decisionGate)
        setDecisionGateModalOpen(true)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingAnimation />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (!project || ganttItems.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No activities or tasks found. Please add activities and tasks to view the Gantt chart.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Gantt Chart</h3>
      </div>

      <GanttChart
        tasks={project.tasks}
        activities={project.activities}
        deliverables={project.deliverables}
        decisionGates={project.decisionGates ?? []}
        chartLoading={false}
        onElementClick={handleElementClick}
      />

      {/* Detail Modals */}
      <ActivityDetailModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        activity={selectedActivity}
      />
      <TaskDetailModal isOpen={taskModalOpen} onClose={() => setTaskModalOpen(false)} task={selectedTask} />
      <DeliverableDetailModal
        isOpen={deliverableModalOpen}
        onClose={() => setDeliverableModalOpen(false)}
        deliverable={selectedDeliverable}
      />
      <DecisionGateDetailModal
        isOpen={decisionGateModalOpen}
        onClose={() => setDecisionGateModalOpen(false)}
        decisionGate={selectedDecisionGate}
      />
    </div>
  )
}
