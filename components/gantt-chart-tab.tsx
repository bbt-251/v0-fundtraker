"use client"
import { useState, useEffect } from "react"
import { getProject } from "@/services/project-service"
import type { Project } from "@/types/project"
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

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, TimeScale)

interface GanttChartTabProps {
  projectId: string
}

interface GanttItem {
  id: string
  name: string
  type: "activity" | "task"
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
        decisionGates={project.decisionGates??[]} 
        chartLoading={false} 
        onElementClick={undefined}
      />

    </div>
  )
}
