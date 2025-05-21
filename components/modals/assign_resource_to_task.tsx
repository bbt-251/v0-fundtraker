"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, AlertCircle, Check, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { csv2json } from "csvjson-csv2json";
import { ProjectTask, HumanResource, MaterialResource } from "@/types/project";
import { addTaskResourceAssignment } from "@/services/project-service";
import { format } from "date-fns";

interface ImportAssignResourcesModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    tasks: ProjectTask[];
    humanResources: HumanResource[];
    materialResources: MaterialResource[];
    onAssignmentsImported: (updatedTasks: ProjectTask[]) => void;
}

export function ImportAssignResourcesModal({
    isOpen,
    onClose,
    projectId,
    tasks,
    humanResources,
    materialResources,
    onAssignmentsImported,
}: ImportAssignResourcesModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [detailedErrors, setDetailedErrors] = useState<string[]>([]);

    const assignmentTemplate = [
        {
            taskName: "Task 1",
            resourceName: "Developer",
            resourceType: "human",
            quantity: 1,
            multipleRanges: false,
            startDate: "2025-05-01",
            endDate: "2025-05-10",
            dateRanges: [],
        },
        {
            taskName: "Task 2",
            resourceName: "Development Laptop",
            resourceType: "material",
            quantity: 2,
            multipleRanges: true,
            dateRanges: [
                { startDate: "2025-06-01", endDate: "2025-06-05" },
                { startDate: "2025-06-10", endDate: "2025-06-15" },
            ],
        },
    ];

    const handleDownloadTemplate = () => {
        try {
            const templateJson = JSON.stringify(assignmentTemplate, null, 2);
            const blob = new Blob([templateJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "assign-resources-template.json";
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            setError(error.message || "Failed to download template");
        }
    };

    const handleDownloadCSVTemplate = () => {
        try {
            const keys = Object.keys(assignmentTemplate[0]);

            // Create CSV header
            let csv = keys.join(",") + "\n";

            // Add rows
            assignmentTemplate.forEach((item) => {
                const row = keys
                    .map((key) => {
                        const value = (item as any)[key] || "";

                        // Handle arrays or objects as JSON strings
                        if (Array.isArray(value) || typeof value === "object") {
                            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
                        }

                        // Handle values with commas by wrapping in quotes
                        return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
                    })
                    .join(",");
                csv += row + "\n";
            });

            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "assign-resources-template.csv";
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error: any) {
            setError(error.message || "Failed to download CSV template");
        }
    };

    const parseCSV = (csvText: string): any[] => {
        try {
            const options = {
                parseNumbers: true,
                parseBooleans: false,
                trim: true,
            };

            const jsonArray = csv2json(csvText, options);

            // Post-process to parse JSON strings in specific fields (e.g., dateRanges)
            return jsonArray.map((item: any) => {
                if (typeof item.dateRanges === "string") {
                    try {
                        item.dateRanges = JSON.parse(item.dateRanges);
                    } catch {
                        item.dateRanges = []; // Default to an empty array if parsing fails
                    }
                }
                return item;
            });
        } catch (err) {
            console.error("Error parsing CSV:", err);
            throw new Error("Failed to parse CSV file. Please check the file format.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
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
                    setError("Unsupported file format. Please upload a JSON or CSV file.");
                    return;
                }

                if (!Array.isArray(parsedData)) {
                    setError("Invalid data format. Expected an array of resource assignments.");
                    return;
                }

                handleImport(parsedData);
            } catch (err) {
                console.error("Error parsing file:", err);
                setError("Failed to parse file. Please check the file format.");
            }
        };

        reader.readAsText(selectedFile);
    };

    const validateAssignment = (assignment: any): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!assignment.taskName) errors.push("Task name is required");
        if (!assignment.resourceName) errors.push("Resource name is required");
        if (!assignment.resourceType || (assignment.resourceType !== "human" && assignment.resourceType !== "material")) {
            errors.push("Resource type must be either 'human' or 'material'");
        }
        if (!assignment.quantity || assignment.quantity <= 0) errors.push("Quantity must be greater than 0");

        if (assignment.multipleRanges) {
            if (!assignment.dateRanges || !Array.isArray(assignment.dateRanges) || assignment.dateRanges.length === 0) {
                errors.push("At least one date range is required for multiple ranges");
            } else {
                assignment.dateRanges.forEach((range: any, index: number) => {
                    if (!range.startDate || !range.endDate) {
                        errors.push(`Date range ${index + 1} must have both startDate and endDate`);
                    }
                });
            }
        } else {
            if (!assignment.startDate || !assignment.endDate) {
                errors.push("Start and end dates are required");
            }
        }

        // Validate task name
        const task = tasks.find((t) => t.name === assignment.taskName);
        if (!task) errors.push(`Task "${assignment.taskName}" does not exist`);

        // Validate resource name
        if (assignment.resourceType === "human") {
            const resource = humanResources.find((r) => r.role === assignment.resourceName);
            if (!resource) errors.push(`Human resource "${assignment.resourceName}" does not exist`);
        } else if (assignment.resourceType === "material") {
            const resource = materialResources.find((r) => r.name === assignment.resourceName);
            if (!resource) errors.push(`Material resource "${assignment.resourceName}" does not exist`);
        }

        return { valid: errors.length === 0, errors };
    };

    const handleImport = async (assignmentsToImport: any[]) => {
        setLoading(true);
        setError(null);
        setImportSuccess(false);
        setDetailedErrors([]);

        console.log("assignmentsToImport: ", assignmentsToImport);

        try {
            const updatedTasks: ProjectTask[] = [];
            const errors: string[] = [];

            for (const assignment of assignmentsToImport) {
                const { valid, errors: assignmentErrors } = validateAssignment(assignment);

                if (valid) {
                    const task = tasks.find((t) => t.name === assignment.taskName)!;
                    const resource =
                        assignment.resourceType === "human"
                            ? humanResources.find((r) => r.role === assignment.resourceName)!
                            : materialResources.find((r) => r.name === assignment.resourceName)!;

                    let startDate: string;
                    let endDate: string;
                    let duration: number;
                    const quantity = assignment.quantity;
                    let dateRanges: { startDate: string; endDate: string }[] | undefined;
                    let dailyCost: number;
                    let totalCost: number;

                    if (assignment.multipleRanges) {
                        dateRanges = assignment.dateRanges.map((range: any) => ({
                            startDate: format(new Date(range.startDate), "yyyy-MM-dd"),
                            endDate: format(new Date(range.endDate), "yyyy-MM-dd"),
                        }));

                        const allDates = (dateRanges || []).flatMap((range) => [new Date(range.startDate), new Date(range.endDate)]);
                        const minDate = new Date(Math.min(...allDates.map((date) => date.getTime())));
                        const maxDate = new Date(Math.max(...allDates.map((date) => date.getTime())));

                        startDate = format(minDate, "yyyy-MM-dd");
                        endDate = format(maxDate, "yyyy-MM-dd");

                        duration = (dateRanges || []).reduce((total, range) => {
                            return total + calculateDuration(range.startDate, range.endDate);
                        }, 0);
                    } else {
                        startDate = format(new Date(assignment.startDate), "yyyy-MM-dd");
                        endDate = format(new Date(assignment.endDate), "yyyy-MM-dd");
                        duration = calculateDuration(startDate, endDate);
                        dateRanges = undefined;
                    }

                    const costCalc = calculateResourceCost(assignment.resourceType, resource, quantity, startDate, endDate);

                    dailyCost = costCalc.dailyCost;
                    totalCost = assignment.multipleRanges ? duration * dailyCost * quantity : costCalc.totalCost;

                    const newAssignment = await addTaskResourceAssignment(projectId, task.id, {
                        resourceId: resource.id,
                        resourceType: assignment.resourceType,
                        quantity,
                        startDate,
                        endDate,
                        duration,
                        dailyCost,
                        totalCost,
                        ...(dateRanges ? { dateRanges } : {}),
                        multipleRanges: assignment.multipleRanges,
                    });

                    const updatedTask = {
                        ...task,
                        resources: [...task.resources, newAssignment],
                    };

                    updatedTasks.push(updatedTask);
                } else {
                    errors.push(`Assignment for task "${assignment.taskName}": ${assignmentErrors.join(", ")}`);
                }
            }

            setImportedCount(updatedTasks.length);
            setImportSuccess(true);
            onAssignmentsImported(updatedTasks);

            if (errors.length > 0) {
                setDetailedErrors(errors);
            }
        } catch (err: any) {
            console.error("Error importing assignments:", err);
            setError(err.message || "Failed to import resource assignments");
        } finally {
            setLoading(false);
        }
    };

    const calculateResourceCost = (
        resourceType: "human" | "material",
        resource: HumanResource | MaterialResource,
        quantity: number,
        startDate: string,
        endDate: string
    ) => {
        const duration = calculateDuration(startDate, endDate);

        if (resourceType === "human") {
            const dailyCost = (resource as HumanResource).costPerDay;
            return {
                dailyCost,
                totalCost: dailyCost * duration * quantity,
            };
        } else if (resourceType === "material") {
            const material = resource as MaterialResource;
            if (material.costType === "one-time") {
                return {
                    dailyCost: material.costAmount / (material.amortizationPeriod || 1),
                    totalCost: material.costAmount * quantity,
                };
            } else {
                return {
                    dailyCost: material.costAmount,
                    totalCost: material.costAmount * duration * quantity,
                };
            }
        }

        return { dailyCost: 0, totalCost: 0 };
    };

    const calculateDuration = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return diffDays;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg">
                <DialogHeader className="mt-4">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Import Resource Assignments</span>
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
                            <AlertDescription>Successfully imported {importedCount} resource assignments!</AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use the <strong>taskName</strong> field to specify the task name and the <strong>resourceName</strong> field to
                            specify the resource name. The system will automatically map them to their corresponding IDs when saving to the
                            database.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <strong>Mandatory fields:</strong> taskName, resourceName, resourceType, quantity, startDate, endDate (or
                            dateRanges for multiple ranges)
                        </p>
                    </div>

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
                        onClick={() => handleImport([])}
                        disabled={!file || loading || importSuccess}
                        className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            "Import Assignments"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}