"use client"

import { useState, useEffect, useRef } from "react"
import { getProject } from "@/services/project-service"
import type { Project } from "@/types/project"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
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
import { Bar } from "react-chartjs-2"
import "chartjs-adapter-date-fns"
import { addMonths, format, parseISO, differenceInDays } from "date-fns"

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend, TimeScale)

interface GanttChartTabProps {
  projectId: string
}

type TimeUnit = "day" | "week" | "month" | "quarter" | "year"
type TimeView = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly"

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
  const [timeView, setTimeView] = useState<TimeView>("Weekly")
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([])
  const [minDate, setMinDate] = useState<Date>(new Date())
  const [maxDate, setMaxDate] = useState<Date>(addMonths(new Date(), 3))
  const chartRef = useRef<ChartJS>(null)

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

    // If we have dates, set them
    if (hasSetDates) {
      // Add some padding to the dates
      setMinDate(new Date(earliestDate.getTime() - 86400000)) // One day before
      setMaxDate(new Date(latestDate.getTime() + 86400000)) // One day after
    }

    setGanttItems(items)
  }

  const getTimeUnit = (): TimeUnit => {
    switch (timeView) {
      case "Daily":
        return "day"
      case "Weekly":
        return "week"
      case "Monthly":
        return "month"
      case "Quarterly":
        return "quarter"
      case "Yearly":
        return "year"
      default:
        return "week"
    }
  }

  const getStepSize = (): number => {
    switch (timeView) {
      case "Daily":
        return 1
      case "Weekly":
        return 7
      case "Monthly":
        return 30
      case "Quarterly":
        return 90
      case "Yearly":
        return 365
      default:
        return 7
    }
  }

  const getTimeFormat = (): string => {
    switch (timeView) {
      case "Daily":
        return "MMM d"
      case "Weekly":
        return "MMM d"
      case "Monthly":
        return "MMM yyyy"
      case "Quarterly":
        return "QQQ yyyy"
      case "Yearly":
        return "yyyy"
      default:
        return "MMM d"
    }
  }

  const getChartOptions = () => {
    return {
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          position: "bottom" as const,
          type: "time" as const,
          time: {
            unit: getTimeUnit(),
            stepSize: getStepSize(),
            displayFormats: {
              day: "MMM d",
              week: "MMM d",
              month: "MMM yyyy",
              quarter: "QQQ yyyy",
              year: "yyyy",
            },
          },
          min: minDate.toISOString(),
          max: maxDate.toISOString(),
          grid: {
            display: true,
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true,
          },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            major: {
              enabled: true,
            },
            font: {
              size: 12,
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "bottom" as const,
        },
        tooltip: {
          callbacks: {
            title: (context: any) => {
              const item = ganttItems[context[0].dataIndex]
              return item.name
            },
            label: (context: any) => {
              const item = ganttItems[context.dataIndex]
              return [
                `Duration (days): ${item.duration}`,
                `Start: ${format(item.startDate, "MMM d, yyyy")}`,
                `End: ${format(item.endDate, "MMM d, yyyy")}`,
                item.type === "task" ? `Activity: ${item.parentName}` : "",
              ].filter(Boolean)
            },
          },
        },
      },
    }
  }

  const getChartData = () => {
    return {
      labels: ganttItems.map((item) => item.name),
      datasets: [
        {
          label: "Duration (days)",
          data: ganttItems.map((item) => ({
            x: [item.startDate, item.endDate],
            y: item.name,
            duration: item.duration,
          })),
          backgroundColor: ganttItems.map((item) =>
            item.type === "activity" ? "rgba(54, 162, 235, 0.8)" : "rgba(255, 99, 132, 0.8)",
          ),
          borderColor: ganttItems.map((item) => (item.type === "activity" ? "rgb(54, 162, 235)" : "rgb(255, 99, 132)")),
          borderWidth: 1,
          borderSkipped: false,
          borderRadius: 4,
          barPercentage: 0.8,
        },
      ],
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
        <Select value={timeView} onValueChange={(value: TimeView) => setTimeView(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Weekly">Weekly</SelectItem>
            <SelectItem value="Monthly">Monthly</SelectItem>
            <SelectItem value="Quarterly">Quarterly</SelectItem>
            <SelectItem value="Yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="h-[500px]">
            <Bar ref={chartRef} options={getChartOptions()} data={getChartData()} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
