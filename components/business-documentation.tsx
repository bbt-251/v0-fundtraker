"use client"

import type React from "react"
import { useState, useRef } from "react"
import { ChevronLeft, ChevronRight, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentUploadSection } from "./document-upload-section"
import { cn } from "@/lib/utils"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadTime: Date
  documentType: "business" | "tax" | "additional"
  status: "uploaded" | "processing" | "verified" | "rejected"
}

interface BusinessDocumentationProps {
  onBack: () => void
  onContinue: () => void
  projectId: string
  existingFiles?: UploadedFile[]
  onUploadFiles?: (files: File[], type: string) => Promise<void>
}

export function BusinessDocumentation({
  onBack,
  onContinue,
  projectId,
  existingFiles = [],
  onUploadFiles,
}: BusinessDocumentationProps) {
  const businessFileInputRef = useRef<HTMLInputElement>(null)
  const taxFileInputRef = useRef<HTMLInputElement>(null)
  const additionalFileInputRef = useRef<HTMLInputElement>(null)

  const businessDocs = existingFiles.filter((f) => f.documentType === "business")
  const taxDocs = existingFiles.filter((f) => f.documentType === "tax")
  const additionalDocs = existingFiles.filter((f) => f.documentType === "additional")

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "business" | "tax" | "additional",
  ) => {
    if (!event.target.files || !onUploadFiles) return

    try {
      setUploading(true)
      setError(null)
      const files = Array.from(event.target.files)
      await onUploadFiles(files, type)
      // Reset the file input
      event.target.value = ""
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uploading files")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Business Documentation</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Upload legal papers and business documents for transparency to donors and investors.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 flex">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0" />
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Hidden file inputs */}
        <input
          ref={businessFileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e, "business")}
          className="hidden"
        />
        <input
          ref={taxFileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e, "tax")}
          className="hidden"
        />
        <input
          ref={additionalFileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e, "additional")}
          className="hidden"
        />

        {/* Business Registration */}
        <DocumentUploadSection
          title="Business Registration"
          description="Upload business registration certificate, articles of incorporation, etc."
          documentCount={businessDocs.length}
          onSelectFiles={() => businessFileInputRef.current?.click()}
        />

        {/* Tax Documents */}
        <DocumentUploadSection
          title="Tax Documents"
          description="Upload tax identification documents and certificates"
          documentCount={taxDocs.length}
          onSelectFiles={() => taxFileInputRef.current?.click()}
        />

        {/* Additional Documents */}
        <DocumentUploadSection
          title="Additional Documents"
          description="Upload any additional legal documents relevant to your project"
          documentCount={additionalDocs.length}
          onSelectFiles={() => additionalFileInputRef.current?.click()}
        />
      </div>

      {/* File list displays if there are files */}
      {existingFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Uploaded Documents</h3>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {existingFiles.map((file) => (
                  <tr key={file.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      {file.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.documentType.charAt(0).toUpperCase() + file.documentType.slice(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {file.uploadTime.toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={cn(
                          "px-2 inline-flex text-xs leading-5 font-semibold rounded-full",
                          file.status === "verified" &&
                            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                          file.status === "processing" &&
                            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
                          file.status === "rejected" && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
                          file.status === "uploaded" &&
                            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
                        )}
                      >
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2" disabled={uploading}>
          <ChevronLeft className="h-4 w-4" />
          Back to Project Info
        </Button>
        <Button onClick={onContinue} className="flex items-center gap-2" disabled={uploading}>
          Upload Documents
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
