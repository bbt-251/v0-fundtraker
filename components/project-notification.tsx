"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getProjects } from "@/services/project-service"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

export function ProjectNotification() {
  const { user } = useAuth()
  const [pendingProjects, setPendingProjects] = useState<
    { id: string; name: string; approvalStatus: string; rejectionReason?: string }[]
  >([])
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return

      try {
        const projects = await getProjects(user.uid)
        const filteredProjects = projects
          .filter((p) => p.isAnnouncedToDonors)
          .map((p) => ({
            id: p.id,
            name: p.name,
            approvalStatus: p.approvalStatus || "pending",
            rejectionReason: p.rejectionReason,
          }))

        setPendingProjects(filteredProjects)

        // Show notification if there are pending or rejected projects
        if (filteredProjects.some((p) => p.approvalStatus === "pending" || p.approvalStatus === "rejected")) {
          setShowNotification(true)
        }
      } catch (error) {
        console.error("Error fetching projects for notifications:", error)
      }
    }

    fetchProjects()

    // Check for updates every minute
    const interval = setInterval(fetchProjects, 60000)
    return () => clearInterval(interval)
  }, [user])

  const closeNotification = () => {
    setShowNotification(false)
  }

  if (!showNotification || pendingProjects.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-20 right-4 z-50 w-96 max-w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
            <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Project Notifications
            </h3>
            <button
              onClick={closeNotification}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {pendingProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start">
                    {project.approvalStatus === "pending" ? (
                      <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                    ) : project.approvalStatus === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                      {project.approvalStatus === "pending" ? (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Awaiting approval from platform governor
                        </p>
                      ) : project.approvalStatus === "approved" ? (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Project approved and visible to donors
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-red-600 dark:text-red-400">Project announcement rejected</p>
                          {project.rejectionReason && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded">
                              Reason: {project.rejectionReason}
                            </p>
                          )}
                        </>
                      )}
                      <div className="mt-2">
                        <Link
                          href={`/projects?id=${project.id}`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Project
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
