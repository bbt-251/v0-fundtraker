"use client"
import { FileText, X, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DocumentStatus = "uploaded" | "processing" | "verified" | "rejected"

interface DocumentCardProps {
  name: string
  type: string
  status: DocumentStatus
  onRemove: () => void
  className?: string
}

export function DocumentCard({ name, type, status, onRemove, className }: DocumentCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusClass = () => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
    }
  }

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md">
          <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
          <div className="flex items-center mt-1 space-x-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{type}</span>
            <span className={cn("px-2 text-xs font-medium rounded-full", getStatusClass())}>
              <span className="flex items-center gap-1">
                {getStatusIcon()}
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </span>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-gray-500 hover:text-red-500">
        <X className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
    </div>
  )
}
