"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, AlertCircle, FileText, Check, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addProjectTask } from "@/services/project-service";
import { tasksTemplate } from "../import/tasks-template";
import { ProjectTask, ProjectActivity } from "@/types/project";

interface ImportTasksModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onTasksImported: (tasks: ProjectTask[]) => void;
    activities: ProjectActivity[]; // Pass the project's activities for validation
    teamMembers: { id: string; email: string; firstName: string; lastName: string }[]; // Team members for validation
}

export function ImportTasksModal({
    isOpen,
    onClose,
    projectId,
    onTasksImported,
    activities,
    teamMembers,
}: ImportTasksModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<any[] | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [detailedErrors, setDetailedErrors] = useState<string[]>([]); // Store detailed errors

    const handleDownloadTemplate = () => {
        try {
            // Create a JSON string of the template
            const templateJson = JSON.stringify(tasksTemplate, null, 2);

            // Create a blob and download link
            const blob = new Blob([templateJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            // Create a temporary link and trigger download
            const link = document.createElement("a");
            link.href = url;
            link.download = "tasks-template.json";
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            setError(error.message || "Failed to download template");
        }
    };

    const handleDownloadCSVTemplate = () => {
        try {
            // Get all possible keys from the template
            const keys = Array.from(new Set(tasksTemplate.flatMap((item) => Object.keys(item))));

            // Create CSV header
            let csv = keys.join(",") + "\n";

            // Add rows
            tasksTemplate.forEach((item) => {
                const row = keys
                    .map((key) => {
                        const value = (item as any)[key] || "";

                        // Serialize dateRanges as JSON if it's an array
                        if (key === "dateRanges" && Array.isArray(value)) {
                            return `"${JSON.stringify(value).replace(/"/g, '""')}"`; // Escape quotes for CSV
                        }

                        // Handle values with commas by wrapping in quotes
                        return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
                    })
                    .join(",");
                csv += row + "\n";
            });

            // Create a blob and download link
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            // Create a temporary link and trigger download
            const link = document.createElement("a");
            link.href = url;
            link.download = "tasks-template.csv";
            document.body.appendChild(link);
            link.click();

            // Clean up
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            setError(error.message || "Failed to download CSV template");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setPreview(null);
        setImportSuccess(false);
        setDetailedErrors([]);

        const fileType = selectedFile.type;
        if (fileType !== "application/json" && fileType !== "text/csv") {
            setError("Please upload a JSON or CSV file");
            setFile(null);
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const result = event.target?.result as string;
                let parsedData: any[] = [];

                if (fileType === "application/json") {
                    parsedData = JSON.parse(result);
                } else if (fileType === "text/csv") {
                    parsedData = parseCSV(result);
                } else {
                    setError("Unsupported file format");
                    return;
                }

                if (!Array.isArray(parsedData)) {
                    setError("Invalid data format. Expected an array of tasks.");
                    return;
                }

                setPreview(parsedData.slice(0, 5));
            } catch (err) {
                console.error("Error parsing file:", err);
                setError("Failed to parse file. Please check the file format.");
            }
        };

        reader.readAsText(selectedFile);
    };

    const parseCSV = (csvText: string): any[] => {
        const lines = csvText.split("\n");
        const headers = lines[0].split(",").map((header) => header.trim());

        return lines
            .slice(1)
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const values = line.split(",").map((value) => value.trim());
                const item: any = {};

                headers.forEach((header, index) => {
                    let value = values[index] || "";

                    // Deserialize dateRanges if it's a JSON string
                    if (header === "dateRanges" && value.startsWith("[") && value.endsWith("]")) {
                        try {
                            value = JSON.parse(value);
                        } catch {
                            value = "[]"; // Default to an empty JSON array string if parsing fails
                        }
                    }

                    item[header] = value;
                });

                return item;
            });
    };

    const validateTask = (task: any): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!task.title) errors.push("Task title is required");
        if (!task.status) errors.push("Task status is required");

        // Validate activity name
        const activity = activities.find((a) => a.id === task.activityId || a.name === task.activityId);
        if (!activity) errors.push(`Activity "${task.activityId}" does not exist`);

        // Validate assignedTo
        if (task.assignedTo) {
            const teamMember = teamMembers.find((member) => member.email === task.assignedTo);
            if (!teamMember) errors.push(`AssignedTo "${task.assignedTo}" does not match any team member`);
        }

        // Validate mutually exclusive fields
        const hasStartDateAndEndDate = task.startDate && task.endDate;
        const hasDateRanges = task.dateRanges && task.dateRanges.length > 0;

        if (task.multipleRanges) {
            if (hasStartDateAndEndDate) {
                errors.push("If multipleRanges is true, startDate and endDate cannot be filled.");
            }
            if (!hasDateRanges) {
                errors.push("If multipleRanges is true, dateRanges must be provided.");
            }
        } else {
            if (hasDateRanges) {
                errors.push("If multipleRanges is false, dateRanges cannot be filled.");
            }
            if (!hasStartDateAndEndDate) {
                errors.push("If multipleRanges is false, both startDate and endDate must be provided.");
            }
        }

        return { valid: errors.length === 0, errors };
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setImportSuccess(false);
        setDetailedErrors([]);

        try {
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const result = event.target?.result as string;
                    let tasksToImport: any[] = [];

                    if (file.type === "application/json") {
                        tasksToImport = JSON.parse(result);
                    } else if (file.type === "text/csv") {
                        tasksToImport = parseCSV(result);
                    } else {
                        setError("Unsupported file format");
                        setLoading(false);
                        return;
                    }

                    if (!Array.isArray(tasksToImport)) {
                        setError("Invalid data format. Expected an array of tasks.");
                        setLoading(false);
                        return;
                    }

                    const importedTasks: ProjectTask[] = [];
                    const errors: string[] = [];

                    for (const taskData of tasksToImport) {
                        const { valid, errors: taskErrors } = validateTask(taskData);

                        if (valid) {
                            const activity = activities.find((a) => a.id === taskData.activityId || a.name === taskData.activityId);
                            const teamMember = teamMembers.find((member) => member.email === taskData.assignedTo);

                            // Calculate duration
                            let duration = 0;
                            if (taskData.multipleRanges) {
                                duration = taskData.dateRanges.reduce((total: number, range: any) => {
                                    const start = new Date(range.startDate);
                                    const end = new Date(range.endDate);
                                    return total + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                }, 0);
                            } else {
                                const start = new Date(taskData.startDate);
                                const end = new Date(taskData.endDate);
                                duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                            }

                            const task: Omit<ProjectTask, "id" | "resources"> = {
                                name: taskData.title,
                                description: taskData.description || "",
                                status: taskData.status,
                                activityId: activity!.id, // Use activity ID
                                startDate: taskData.startDate || "",
                                endDate: taskData.endDate || "",
                                duration,
                                priority: taskData.priority || "Medium",
                                assignedTo: teamMember?.id || "Unassigned",
                                assignedToName: teamMember ? `${teamMember.firstName} ${teamMember.lastName}` : "",
                                multipleRanges: taskData.multipleRanges || false,
                                dateRanges: taskData.dateRanges || [],
                            };

                            const newTask = await addProjectTask(projectId, task);
                            importedTasks.push(newTask);
                        } else {
                            errors.push(`Task "${taskData.title}": ${taskErrors.join(", ")}`);
                        }
                    }

                    setImportedCount(importedTasks.length);
                    setImportSuccess(true);
                    onTasksImported(importedTasks);

                    if (errors.length > 0) {
                        setDetailedErrors(errors);
                    }

                    setTimeout(() => {
                        setFile(null);
                        setPreview(null);
                        setImportSuccess(false);
                        if (errors.length === 0) {
                            onClose();
                        }
                    }, 2000);
                } catch (err: any) {
                    console.error("Error importing tasks:", err);
                    setError(err.message || "Failed to import tasks");
                } finally {
                    setLoading(false);
                }
            };

            reader.readAsText(file);
        } catch (err: any) {
            console.error("Error reading file:", err);
            setError(err.message || "Failed to read file");
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg">
                <DialogHeader className="mt-4">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Import Tasks</span>
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
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use the <strong>activity</strong> field to specify the name of the activity. The system will
                            automatically map it to the corresponding activity ID. Ensure the activity name matches an
                            existing activity in the project.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            Use the <strong>assignedTo</strong> field to specify the email of the team member. The system
                            will automatically map it to the corresponding team member ID and name.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            For <strong>multipleRanges</strong>, set it to <code>true</code> or <code>false</code>. If
                            <code>true</code>, provide <strong>dateRanges</strong> as an array of objects with <code>startDate</code> and <code>endDate</code>.
                            In CSV files, use JSON format for the <code>dateRanges</code> field. If <code>false</code>, provide
                            <strong>startDate</strong> and <strong>endDate</strong>. All three fields cannot be filled at the same time.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <strong>Mandatory fields:</strong> title, status, activity
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Optional fields:</strong> description, startDate, endDate, duration, priority,
                            assignedTo, multipleRanges, dateRanges
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {detailedErrors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Import Errors</h4>
                            <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                                {detailedErrors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {importSuccess && (
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <Check className="h-4 w-4 text-green-600" />
                            <AlertDescription>Successfully imported {importedCount} tasks!</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".json,.csv"
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-700">
                                {file ? file.name : "Click to upload or drag and drop"}
                            </span>
                            <span className="text-xs text-gray-500 mt-1">JSON or CSV files supported</span>
                        </label>
                    </div>
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
                            "Import Tasks"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}