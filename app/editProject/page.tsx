"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { getProject, updateProject, uploadProjectDocument, deleteProjectDocument } from "@/services/project-service"
import type { Project, ProjectDocument } from "@/types/project"
import Link from "next/link"
import { ArrowLeft, Save, FileText, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { CorsErrorBanner } from "@/components/cors-error-banner"
import { FileUpload } from "@/components/file-upload"

const projectCategories = ["environment", "education", "healthcare", "technology", "agriculture", "other"] as const

export default function EditProjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get("id")
  const { user } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("definition")
  const [showFundAccountSetup, setShowFundAccountSetup] = useState(false)
  const [definitionStep, setDefinitionStep] = useState<"info" | "documentation">("info")

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    scope: "",
    objectives: "",
    location: "",
    category: "technology" as (typeof projectCategories)[number],
  })

  // Document uploads
  const [businessDocs, setBusinessDocs] = useState<File[]>([])
  const [taxDocs, setTaxDocs] = useState<File[]>([])
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([])

  useEffect(() => {
    async function fetchProject() {
      if (!user || !projectId) {
        setLoading(false)
        setError("Project ID is missing or you're not logged in")
        return
      }

      try {
        setLoading(true)
        const fetchedProject = await getProject(projectId)

        // Check if the project belongs to the current user
        if (fetchedProject.userId !== user.uid) {
          router.push("/projects")
          return
        }

        setProject(fetchedProject)
        setFormData({
          name: fetchedProject.name,
          scope: fetchedProject.scope,
          objectives: fetchedProject.objectives,
          location: fetchedProject.location,
          category: fetchedProject.category,
        })
      } catch (error: any) {
        setError(error.message || "Failed to fetch project")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [user, projectId, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddFiles = (files: File[], type: "business" | "tax" | "additional") => {
    switch (type) {
      case "business":
        setBusinessDocs((prev) => [...prev, ...files])
        break
      case "tax":
        setTaxDocs((prev) => [...prev, ...files])
        break
      case "additional":
        setAdditionalDocs((prev) => [...prev, ...files])
        break
    }
  }

  const handleRemoveFile = (fileName: string, type: "business" | "tax" | "additional") => {
    switch (type) {
      case "business":
        setBusinessDocs((prev) => prev.filter((file) => file.name !== fileName))
        break
      case "tax":
        setTaxDocs((prev) => prev.filter((file) => file.name !== fileName))
        break
      case "additional":
        setAdditionalDocs((prev) => prev.filter((file) => file.name !== fileName))
        break
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!project || !projectId) return

    try {
      await deleteProjectDocument(projectId, documentId)

      // Update the project state
      setProject((prev) => {
        if (!prev) return null
        return {
          ...prev,
          documents: prev.documents.filter((doc) => doc.id !== documentId),
        }
      })
    } catch (error: any) {
      setError(error.message || "Failed to delete document")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !project || !projectId) {
      setError("You must be logged in to update a project")
      return
    }

    // Validate form
    if (!formData.name.trim()) {
      setError("Project name is required")
      return
    }

    if (!formData.scope.trim()) {
      setError("Project scope is required")
      return
    }

    if (!formData.objectives.trim()) {
      setError("Project objectives is required")
      return
    }

    if (!formData.location.trim()) {
      setError("Project location is required")
      return
    }

    setSaving(true)
    setError("")

    try {
      // Update project details
      await updateProject(projectId, formData)

      // Upload new documents
      // Upload business documents
      for (const file of businessDocs) {
        await uploadProjectDocument(projectId, file, "business")
      }

      // Upload tax documents
      for (const file of taxDocs) {
        await uploadProjectDocument(projectId, file, "tax")
      }

      // Upload additional documents
      for (const file of additionalDocs) {
        await uploadProjectDocument(projectId, file, "additional")
      }

      // Navigate back to projects page
      router.push("/projects")
    } catch (error: any) {
      setError(error.message || "Failed to update project")
    } finally {
      setSaving(false)
    }
  }

  // Group documents by type
  const groupedDocuments =
    project?.documents?.reduce(
      (acc, doc) => {
        if (!acc[doc.type]) {
          acc[doc.type] = []
        }
        acc[doc.type].push(doc)
        return acc
      },
      {} as Record<string, ProjectDocument[]>,
    ) || {}

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md">
          {error || "Project not found"}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/projects"
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Projects
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Form Header */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Edit Project</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Update your project details and documents</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="px-8 py-4">
              <CorsErrorBanner error={error} />
              <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-md text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "definition"
                      ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("definition")}
                >
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Project Definition
                  </span>
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "resources"
                      ? "text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("resources")}
                >
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
                      <path d="M14 18H4a2 2 0 0 0-2 2"></path>
                      <path d="M22 18h-10a2 2 0 0 0-2 2"></path>
                    </svg>
                    Project Resources
                  </span>
                </button>
              </li>
              <li className="mr-2">
                <button className="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300">
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Project Planning
                  </span>
                </button>
              </li>
              <li className="mr-2">
                <button className="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300">
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    Project Risks
                  </span>
                </button>
              </li>
              <li>
                <button className="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300">
                  <span className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    Project Communication
                  </span>
                </button>
              </li>
            </ul>
          </div>

          {activeTab === "definition" && (
            <div>
              {/* Step Navigation */}
              <div className="px-8 pt-6">
                <div className="flex items-center mb-8">
                  <div className="flex-1">
                    <div className="relative">
                      {/* Progress bar */}
                      <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-1 bg-blue-600 dark:bg-blue-400"
                          style={{ width: definitionStep === "info" ? "50%" : "100%" }}
                        ></div>
                      </div>
                      {/* Steps */}
                      <div className="flex justify-between -mt-2">
                        <button
                          onClick={() => setDefinitionStep("info")}
                          className={`flex flex-col items-center ${
                            definitionStep === "info"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full ${
                              definitionStep === "info"
                                ? "bg-blue-600 dark:bg-blue-400"
                                : "bg-blue-600 dark:bg-blue-400"
                            }`}
                          ></div>
                          <span className="text-xs mt-1">Project Info</span>
                        </button>
                        <button
                          onClick={() => setDefinitionStep("documentation")}
                          className={`flex flex-col items-center ${
                            definitionStep === "documentation"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full ${
                              definitionStep === "documentation"
                                ? "bg-blue-600 dark:bg-blue-400"
                                : "bg-gray-300 dark:bg-gray-600"
                            }`}
                          ></div>
                          <span className="text-xs mt-1">Business Documentation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {definitionStep === "info" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setDefinitionStep("documentation")
                  }}
                >
                  <div className="px-8 py-6">
                    <div className="space-y-6">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Project Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="scope"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Project Scope *
                        </label>
                        <textarea
                          id="scope"
                          name="scope"
                          rows={3}
                          value={formData.scope}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="objectives"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Project Objectives *
                        </label>
                        <textarea
                          id="objectives"
                          name="objectives"
                          rows={3}
                          value={formData.objectives}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="location"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Project Location *
                        </label>
                        <input
                          type="text"
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="category"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                        >
                          Project Category *
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2.5 px-4 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-base"
                          required
                        >
                          {projectCategories.map((category) => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 flex justify-between">
                    <Link
                      href="/projects"
                      className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Next: Business Documentation
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="px-8 py-6">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                          Business Documentation
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          Upload all required business documents for verification. All documents will be reviewed by our
                          team.
                        </p>
                      </div>

                      {/* Document Status Overview */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Document Verification Status
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">3</span> Verified
                            </span>
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">2</span> Pending
                            </span>
                          </div>
                          <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">1</span> Rejected
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Current Documents */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Current Documents</h4>

                        {/* Business Documents */}
                        {groupedDocuments.business && groupedDocuments.business.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Business Documents
                            </h5>
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                  <tr>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Document
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Uploaded
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Status
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {groupedDocuments.business.map((doc) => (
                                    <tr key={doc.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                              {doc.name}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{doc.uploadedAt}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                          Verified
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            View
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Tax Documents */}
                        {groupedDocuments.tax && groupedDocuments.tax.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tax Documents</h5>
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                  <tr>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Document
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Uploaded
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Status
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {groupedDocuments.tax.map((doc) => (
                                    <tr key={doc.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                              {doc.name}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{doc.uploadedAt}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                          Pending
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            View
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Additional Documents */}
                        {groupedDocuments.additional && groupedDocuments.additional.length > 0 && (
                          <div className="mb-6">
                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Additional Documents
                            </h5>
                            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                  <tr>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Document
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Uploaded
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Status
                                    </th>
                                    <th
                                      scope="col"
                                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                                    >
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                  {groupedDocuments.additional.map((doc) => (
                                    <tr key={doc.id}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                                          <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                              {doc.name}
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{doc.uploadedAt}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                          Rejected
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-3">
                                          <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                          >
                                            View
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteDocument(doc.id)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {(!project?.documents || project.documents.length === 0) && (
                          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No documents uploaded yet.</p>
                        )}
                      </div>

                      {/* Upload New Documents */}
                      <div>
                        <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Upload New Documents</h4>

                        {/* Business Documents */}
                        <div className="mb-6">
                          <FileUpload
                            label="Business Documents"
                            type="business"
                            required={true}
                            files={businessDocs}
                            onAddFiles={(files) => handleAddFiles(files, "business")}
                            onRemoveFile={(fileName) => handleRemoveFile(fileName, "business")}
                          />
                        </div>

                        {/* Tax Documents */}
                        <div className="mb-6">
                          <FileUpload
                            label="Tax Documents"
                            type="tax"
                            required={true}
                            files={taxDocs}
                            onAddFiles={(files) => handleAddFiles(files, "tax")}
                            onRemoveFile={(fileName) => handleRemoveFile(fileName, "tax")}
                          />
                        </div>

                        {/* Additional Documents */}
                        <div className="mb-6">
                          <FileUpload
                            label="Additional Documents (Optional)"
                            type="additional"
                            required={false}
                            files={additionalDocs}
                            onAddFiles={(files) => handleAddFiles(files, "additional")}
                            onRemoveFile={(fileName) => handleRemoveFile(fileName, "additional")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setDefinitionStep("info")}
                      className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Back to Project Info
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === "resources" && (
            <div className="px-8 py-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Resources</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Define and manage all resources needed for your project including human resources, materials, and
                financial resources.
              </p>

              {/* Resources tabs */}
              <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
                <ul className="flex flex-wrap -mb-px">
                  <li className="mr-2">
                    <button className="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300">
                      Human Resource
                    </button>
                  </li>
                  <li className="mr-2">
                    <button className="inline-block p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300">
                      Material Resource
                    </button>
                  </li>
                  <li>
                    <button className="inline-block p-4 border-b-2 text-blue-600 border-blue-600 dark:text-blue-400 dark:border-blue-400 rounded-t-lg">
                      Financial Resource
                    </button>
                  </li>
                </ul>
              </div>

              {/* Financial Resource content */}
              <div className="mt-6">
                {!showFundAccountSetup ? (
                  <>
                    <div className="flex justify-end mb-6">
                      <button
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={() => setShowFundAccountSetup(true)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                        Fund Account Setup
                      </button>
                    </div>

                    {/* Project Cost Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Cost Summary</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Project Cost</p>
                          <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">$0.00</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">Human Resources</p>
                          <p className="text-2xl font-bold text-green-800 dark:text-green-300">$0.00</p>
                          <p className="text-xs text-green-600 dark:text-green-500">0% of total</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Material Resources</p>
                          <p className="text-2xl font-bold text-purple-800 dark:text-purple-300">$0.00</p>
                          <p className="text-xs text-purple-600 dark:text-purple-500">0% of total</p>
                        </div>
                      </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Cost Breakdown</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Resource Name
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Type
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Daily Cost
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Quantity
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Days
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Total Cost
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {/* No data row */}
                            <tr>
                              <td
                                colSpan={6}
                                className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                              >
                                No resources added yet
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Fund Release Workflow */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">Fund Release Workflow</h4>
                        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 2v20M2 12h20" />
                          </svg>
                          Add a Milestone
                        </button>
                      </div>
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No fund release milestones defined yet. Start by adding your project milestones.
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white">Financial Resources</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowFundAccountSetup(false)}
                          className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>
                          Back
                        </button>
                        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Fund Account Request
                        </button>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Bank Account Requests</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Account Name
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Bank Name
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Account Type
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                Account one
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                one
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                Foreign Account
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  Pending
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 flex space-x-2">
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                                <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    <line x1="10" y1="11" x2="10" y2="17" />
                                    <line x1="14" y1="11" x2="14" y2="17" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
