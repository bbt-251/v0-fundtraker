"use client"
import { FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DocumentUploadSectionProps {
  title: string
  description: string
  documentCount?: number
  className?: string
  onSelectFiles: () => void
}

export function DocumentUploadSection({
  title,
  description,
  documentCount = 0,
  className,
  onSelectFiles,
}: DocumentUploadSectionProps) {
  return (
    <div className={cn("border border-gray-200 dark:border-gray-700 rounded-lg p-6", className)}>
      <div className="flex flex-col items-center text-center">
        <div className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{description}</p>
        {documentCount > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span className="font-medium">{documentCount}</span> document(s) uploaded
          </div>
        )}
        <Button variant="outline" size="sm" onClick={onSelectFiles} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          <span>Select Files</span>
        </Button>
      </div>
    </div>
  )
}
