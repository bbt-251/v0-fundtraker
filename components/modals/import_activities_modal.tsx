"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, AlertCircle, FileText, Check, Download, HelpCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { addProjectActivity } from "@/services/project-service"
import type { ProjectActivity } from "@/types/project"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { activitiesTemplate } from "../import/activities-template"

interface ImportActivitiesModalProps {
    isOpen: boolean
    onClose: () => void
    projectId: string
    onActivitiesImported: (activities: ProjectActivity[]) => void
}

export function ImportActivitiesModal({
    isOpen,
    onClose,
    projectId,
    onActivitiesImported,
}: ImportActivitiesModalProps) {
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<any[] | null>(null)
    const [importSuccess, setImportSuccess] = useState(false)
    const [importedCount, setImportedCount] = useState(0)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0]
        if (!selectedFile) return

        setFile(selectedFile)
        setError(null)
        setPreview(null)
        setImportSuccess(false)

        // Check file type
        const fileType = selectedFile.type
        if (
            fileType !== "application/json" &&
            fileType !== "text/csv" &&
            fileType !== "application/vnd.ms-excel" &&
            fileType !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ) {
            setError("Please upload a JSON, CSV, or Excel file")
            setFile(null)
            return
        }

        // Parse file for preview
        const reader = new FileReader()
        reader.onload = async (event) => {
            try {
                const result = event.target?.result as string
                let parsedData: any[] = []

                if (fileType === "application/json") {
                    parsedData = JSON.parse(result)
                } else if (fileType === "text/csv") {
                    parsedData = parseCSV(result)
                } else {
                    // For Excel files, we'll need to use a library like xlsx
                    // This is a simplified version
                    setError("Excel parsing is not implemented in this preview")
                    return
                }

                // Validate the data structure
                if (!Array.isArray(parsedData)) {
                    setError("Invalid data format. Expected an array of activities.")
                    return
                }

                // Show preview of first 5 items
                setPreview(parsedData.slice(0, 5))
            } catch (err) {
                console.error("Error parsing file:", err)
                setError("Failed to parse file. Please check the file format.")
            }
        }

        reader.readAsText(selectedFile)
    }

    const parseCSV = (csvText: string): any[] => {
        const lines = csvText.split("\n")
        const headers = lines[0].split(",").map((header) => header.trim())

        return lines
            .slice(1)
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const values = line.split(",").map((value) => value.trim())
                const item: any = {}

                headers.forEach((header, index) => {
                    item[header] = values[index] || ""
                })

                return item
            })
    }

    const validateActivity = (activity: any): { valid: boolean; errors: string[] } => {
        const errors: string[] = []

        if (!activity.name) errors.push("Activity name is required")

        return { valid: errors.length === 0, errors }
    }

    const handleImport = async () => {
        if (!file) return

        setLoading(true)
        setError(null)
        setImportSuccess(false)

        try {
            const reader = new FileReader()

            reader.onload = async (event) => {
                try {
                    const result = event.target?.result as string
                    let activitiesToImport: any[] = []

                    if (file.type === "application/json") {
                        activitiesToImport = JSON.parse(result)
                    } else if (file.type === "text/csv") {
                        activitiesToImport = parseCSV(result)
                    } else {
                        setError("Unsupported file format")
                        setLoading(false)
                        return
                    }

                    if (!Array.isArray(activitiesToImport)) {
                        setError("Invalid data format. Expected an array of activities.")
                        setLoading(false)
                        return
                    }

                    // Validate and import activities
                    const importedActivities: ProjectActivity[] = []
                    const currentDate = new Date().toISOString()

                    console.log("activitiesToImport: ", activitiesToImport);

                    for (const activityData of activitiesToImport) {
                        const { valid, errors } = validateActivity(activityData)

                        if (valid) {
                            // Prepare activity data with required fields
                            const activity: Omit<ProjectActivity, "id" | "createdAt"> = {
                                name: activityData.name,
                                description: activityData.description || "",
                            }

                            // Add activity to project
                            const newActivity = await addProjectActivity(projectId, activity)
                            importedActivities.push(newActivity)
                        } else {
                            console.warn("Skipping invalid activity:", activityData, errors)
                        }
                    }

                    setImportedCount(importedActivities.length)
                    setImportSuccess(true)
                    onActivitiesImported(importedActivities)

                    // Reset after successful import
                    setTimeout(() => {
                        setFile(null)
                        setPreview(null)
                        setImportSuccess(false)
                        if (importedActivities.length === activitiesToImport.length) {
                            onClose()
                        }
                    }, 2000)
                } catch (err: any) {
                    console.error("Error importing activities:", err)
                    setError(err.message || "Failed to import activities")
                } finally {
                    setLoading(false)
                }
            }

            reader.readAsText(file)
        } catch (err: any) {
            console.error("Error reading file:", err)
            setError(err.message || "Failed to read file")
            setLoading(false)
        }
    }

    const handleDownloadTemplate = () => {
        try {
            // Create a JSON string of the template
            const templateJson = JSON.stringify(activitiesTemplate, null, 2)

            // Create a blob and download link
            const blob = new Blob([templateJson], { type: "application/json" })
            const url = URL.createObjectURL(blob)

            // Create a temporary link and trigger download
            const link = document.createElement("a")
            link.href = url
            link.download = "activities-template.json"
            document.body.appendChild(link)
            link.click()

            // Clean up
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error: any) {
            setError(error.message || "Failed to download template")
        }
    }

    const handleDownloadCSVTemplate = () => {
        try {
            // Get all possible keys from the template
            const keys = Array.from(new Set(activitiesTemplate.flatMap((item) => Object.keys(item))))

            // Create CSV header
            let csv = keys.join(",") + "\n"

            // Add rows
            activitiesTemplate.forEach((item) => {
                const row = keys
                    .map((key) => {
                        // Handle values with commas by wrapping in quotes
                        const value = (item as any)[key] || ""
                        return typeof value === "string" && value.includes(",") ? `"${value}"` : value
                    })
                    .join(",")
                csv += row + "\n"
            })

            // Create a blob and download link
            const blob = new Blob([csv], { type: "text/csv" })
            const url = URL.createObjectURL(blob)

            // Create a temporary link and trigger download
            const link = document.createElement("a")
            link.href = url
            link.download = "activities-template.csv"
            document.body.appendChild(link)
            link.click()

            // Clean up
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
        } catch (error: any) {
            setError(error.message || "Failed to download CSV template")
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg">
                <DialogHeader className="mt-4">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Import Activities</span>
                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="h-8 px-2">
                                <Download className="h-4 w-4 mr-1" />
                                JSON
                            </Button>

                            <Button variant="outline" size="sm" onClick={handleDownloadCSVTemplate} className="h-8 px-2">
                                <Download className="h-4 w-4 mr-1" />
                                CSV
                            </Button>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {importSuccess && (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertDescription>Successfully imported {importedCount} activities!</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".json,.csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                {file ? file.name : "Click to upload or drag and drop"}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">JSON, CSV, or Excel files supported</span>
                        </label>
                    </div>

                    {file && !preview && !loading && !importSuccess && (
                        <div className="flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{file.name}</span>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
                            <span className="text-sm text-gray-600">Processing file...</span>
                        </div>
                    )}

                    {preview && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-500 mt-2">
                                Required fields: name
                                <br />
                                Optional fields: description
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex space-x-2 justify-end">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!file || loading || importSuccess}
                        className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            "Import Activities"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
