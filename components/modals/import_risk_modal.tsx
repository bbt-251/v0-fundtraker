"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, AlertCircle, Check, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { addProjectRisk } from "@/services/project-service";
import { ProjectRisk, ProjectActivity, MitigationAction } from "@/types/project";
import { csv2json } from "csvjson-csv2json";
import { riskTemplate } from "../import/risk-template";

interface ImportRiskModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onRisksImported: (risks: ProjectRisk[]) => void;
    activities: ProjectActivity[]; // Pass the project's activities for validation
}

export function ImportRiskModal({
    isOpen,
    onClose,
    projectId,
    onRisksImported,
    activities,
}: ImportRiskModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const [importedCount, setImportedCount] = useState(0);
    const [detailedErrors, setDetailedErrors] = useState<string[]>([]); // Store detailed errors

    const handleDownloadTemplate = () => {
        try {
            const templateJson = JSON.stringify(riskTemplate, null, 2);
            const blob = new Blob([templateJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "risks-template.json";
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
            const keys = Object.keys(riskTemplate[0]);

            // Create CSV header
            let csv = keys.join(",") + "\n";

            // Add rows
            riskTemplate.forEach((item) => {
                const row = keys
                    .map((key) => {
                        const value = (item as any)[key] || "";

                        // Serialize arrays or objects as JSON strings
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
            link.download = "risks-template.csv";
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
                parseNumbers: false,
                parseBooleans: false,
                trim: true,
            };

            const jsonArray = csv2json(csvText, options);

            // Post-process: parse JSON arrays or objects if needed
            return jsonArray.map((item: any) => {
                for (const key in item) {
                    const value = item[key];

                    if (typeof value === "string" && value.trim().startsWith("[") && value.trim().endsWith("]")) {
                        try {
                            item[key] = JSON.parse(value);
                        } catch {
                            // Keep as-is if parsing fails
                        }
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
                    setError("Invalid data format. Expected an array of risks.");
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

    const validateRisk = (risk: any): { valid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (!risk.name) errors.push("Risk name is required");
        if (!risk.description) errors.push("Description is required");
        if (!risk.impact || risk.impact < 1 || risk.impact > 5) errors.push("Impact must be between 1 and 5");
        if (!risk.probability || risk.probability < 1 || risk.probability > 5)
            errors.push("Probability must be between 1 and 5");

        // Ensure associatedActivities is an array
        if (typeof risk.associatedActivities === "string") {
            try {
                risk.associatedActivities = JSON.parse(risk.associatedActivities);
            } catch {
                risk.associatedActivities = []; // Default to an empty array if parsing fails
            }
        }

        if (!Array.isArray(risk.associatedActivities)) {
            risk.associatedActivities = []; // Ensure it's an array
        }

        // Validate associated activities
        if (risk.associatedActivities.length > 0) {
            const invalidActivities = risk.associatedActivities.filter(
                (activityName: string) => !activities.some((activity) => activity.name === activityName)
            );
            if (invalidActivities.length > 0) {
                errors.push(
                    `Invalid associated activities: ${invalidActivities.join(", ")}. Ensure they match existing activity names in the project.`
                );
            }
        }

        return { valid: errors.length === 0, errors };
    };

    const handleImport = async (risksToImport: any[]) => {
        setLoading(true);
        setError(null);
        setImportSuccess(false);
        setDetailedErrors([]);

        try {
            const importedRisks: ProjectRisk[] = [];
            const errors: string[] = [];

            for (const riskData of risksToImport) {
                const { valid, errors: riskErrors } = validateRisk(riskData);

                if (valid) {
                    // Map activity names to activity IDs
                    const associatedActivityIds = riskData.associatedActivities.map((activityName: string) => {
                        const activity = activities.find((a) => a.name === activityName);
                        return activity ? activity.id : null;
                    }).filter((id) => id !== null); // Remove null values

                    const newRisk = await addProjectRisk(projectId, {
                        name: riskData.name,
                        description: riskData.description,
                        impact: riskData.impact,
                        probability: riskData.probability,
                        // riskScore is calculated on the server side
                        associatedActivities: associatedActivityIds,
                        mitigationActions: riskData.mitigationActions || [],
                        status: "Active",
                    });

                    importedRisks.push(newRisk);
                } else {
                    errors.push(`Risk "${riskData.name || "Unnamed"}": ${riskErrors.join(", ")}`);
                }
            }

            setImportedCount(importedRisks.length);
            setImportSuccess(true);
            onRisksImported(importedRisks);

            if (errors.length > 0) {
                setDetailedErrors(errors);
            }
        } catch (err: any) {
            console.error("Error importing risks:", err);
            setError(err.message || "Failed to import risks");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-screen-lg">
                <DialogHeader className="mt-4">
                    <DialogTitle className="flex items-center justify-between">
                        <span>Import Risks</span>
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
                            <AlertDescription>Successfully imported {importedCount} risks!</AlertDescription>
                        </Alert>
                    )}

                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Instructions</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use the <strong>associatedActivities</strong> field to specify activity names. The system will automatically map them to the corresponding activity IDs when saving to the database.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            The <strong>mitigationActions</strong> field is optional and can be left empty.
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            <strong>Mandatory fields:</strong> name, description, impact, probability
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Optional fields:</strong> associatedActivities, mitigationActions
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
                            "Import Risks"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}