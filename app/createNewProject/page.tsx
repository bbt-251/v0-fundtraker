"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { motion, AnimatePresence } from "framer-motion"
import type { ProjectFormData, ProjectDocument } from "@/types/project"
import { createProject, uploadProjectDocument } from "@/services/project-service"
import { Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { CorsErrorBanner } from "@/components/cors-error-banner"
import { FileUpload } from "@/components/file-upload"

const projectCategories = ["environment", "education", "healthcare", "technology", "agriculture", "other"] as const

export default function CreateNewProjectPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Form data
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    scope: "",
    objectives: "",
    location: "",
    category: "technology",
  })

  // Document uploads
  const [businessDocs, setBusinessDocs] = useState<File[]>([])
  const [taxDocs, setTaxDocs] = useState<File[]>([])
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([])
  const [uploadedDocs, setUploadedDocs] = useState<ProjectDocument[]>([])

  // Form validation
  const validateStep1 = () => {
    if (!formData.name.trim()) return "Project name is required"
    if (!formData.scope.trim()) return "Project scope is required"
    if (!formData.objectives.trim()) return "Project objectives is required"
    if (!formData.location.trim()) return "Project location is required"
    return ""
  }

  const validateStep2 = () => {
    if (businessDocs.length === 0) return "At least one business document is required"
    if (taxDocs.length === 0) return "At least one tax document is required"

    const totalDocs = businessDocs.length + taxDocs.length + additionalDocs.length
    if (totalDocs > 5) return "Maximum 5 documents allowed in total"

    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddFiles = (type: "business" | "tax" | "additional", files: File[]) => {
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

  const handleNextStep = () => {
    const error = validateStep1()
    if (error) {
      setError(error)
      return
    }

    setError("")
    setCurrentStep(2)
  }

  const handlePrevStep = () => {
    setError("")
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      setError("You must be logged in to create a project")
      return
    }

    const error = validateStep2()
    if (error) {
      setError(error)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      // Create the project
      const projectData = {
        ...formData,
        userId: user.uid,
        documents: [],
      }

      const newProject = await createProject(projectData)

      // Upload business documents
      for (const file of businessDocs) {
        try {
          await uploadProjectDocument(newProject.id, file, "business")
        } catch (error) {
          console.error(`Failed to upload business document ${file.name}:`, error)
          // Continue with other uploads
        }
      }

      // Upload tax documents
      for (const file of taxDocs) {
        try {
          await uploadProjectDocument(newProject.id, file, "tax")
        } catch (error) {
          console.error(`Failed to upload tax document ${file.name}:`, error)
          // Continue with other uploads
        }
      }

      // Upload additional documents
      for (const file of additionalDocs) {
        try {
          await uploadProjectDocument(newProject.id, file, "additional")
        } catch (error) {
          console.error(`Failed to upload additional document ${file.name}:`, error)
          // Continue with other uploads
        }
      }

      // Navigate to projects page
      router.push("/my-projects")
    } catch (error: any) {
      setError(error.message || "Failed to create project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <div className="flex items-center">
            <Link
              href="/my-projects"
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Projects
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          {/* Form Header */}
          <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Create New Project</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Complete the form below to create a new project
            </p>
          </div>

          {/* Progress Steps */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 my-5">
            <div className="flex items-center">
              <div className="flex items-center relative">
                <div
                  className={`rounded-full transition duration-500 ease-in-out h-12 w-12 flex items-center justify-center ${
                    currentStep >= 1 ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
                  }`}
                >
                  {currentStep > 1 ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-white font-bold">1</span>
                  )}
                </div>
                <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-gray-600 dark:text-gray-400 px-5">
                  Project Information
                </div>
              </div>
              <div
                className={`flex-auto border-t-2 transition duration-500 ease-in-out ${
                  currentStep > 1 ? "border-blue-600" : "border-gray-300 dark:border-gray-700"
                }`}
              ></div>
              <div className="flex items-center relative">
                <div
                  className={`rounded-full transition duration-500 ease-in-out h-12 w-12 flex items-center justify-center ${
                    currentStep >= 2 ? "bg-blue-600" : "bg-gray-300 dark:border-gray-700"
                  }`}
                >
                  <span className="text-white font-bold">2</span>
                </div>
                <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-gray-600 dark:text-gray-400 px-5">
                  Upload Documents
                </div>
              </div>
            </div>
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

          {/* Form Steps */}
          <div className="px-8 py-6">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
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
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Upload Documents</h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Please upload the required documents. Maximum 5 files in total.
                      </p>
                    </div>

                    {/* Business Documents */}
                    <FileUpload
                      label="Business Documents"
                      type="business"
                      required={true}
                      files={businessDocs}
                      onAddFiles={(files) => handleAddFiles("business", files)}
                      onRemoveFile={(fileName) => handleRemoveFile(fileName, "business")}
                    />

                    {/* Tax Documents */}
                    <FileUpload
                      label="Tax Documents"
                      type="tax"
                      required={true}
                      files={taxDocs}
                      onAddFiles={(files) => handleAddFiles("tax", files)}
                      onRemoveFile={(fileName) => handleRemoveFile(fileName, "tax")}
                    />

                    {/* Additional Documents */}
                    <FileUpload
                      label="Additional Documents (Optional)"
                      type="additional"
                      files={additionalDocs}
                      onAddFiles={(files) => handleAddFiles("additional", files)}
                      onRemoveFile={(fileName) => handleRemoveFile(fileName, "additional")}
                    />

                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        <span className="font-medium">Note:</span> Maximum 5 files allowed in total. At least one
                        business document and one tax document are required.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Form Actions */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-700/50 flex justify-between">
            {currentStep === 1 ? (
              <Link
                href="/my-projects"
                className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center px-5 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    Create Project
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
