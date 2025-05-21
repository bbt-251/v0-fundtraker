"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { uploadDocument, formatFileSize } from "@/services/document-service"
import { useAuth } from "@/contexts/auth-context"
import { getTasks } from "@/services/task-service"
import type { Task } from "@/types/task"

interface UploadDocumentDialogProps {
    isOpen: boolean
    onClose: () => void
    onUploadComplete: () => void
    selectedProjectId: string
}

// Initial document types
const initialDocumentTypes = [
    "Contract",
    "Invoice",
    "Document",
    "Notes",
    "Diagram",
    "Documentation",
    "Design",
    "Spreadsheet",
    "Presentation",
    "Report",
]

export function UploadDocumentDialog({
    isOpen,
    onClose,
    onUploadComplete,
    selectedProjectId,
}: UploadDocumentDialogProps) {
    const { user, userProfile } = useAuth()
    const { toast } = useToast()

    // Form state
    const [selectedTask, setSelectedTask] = useState<string>("none")
    const [documentName, setDocumentName] = useState("")
    const [documentType, setDocumentType] = useState<string>("none")
    const [tags, setTags] = useState("")
    const [description, setDescription] = useState("")
    const [file, setFile] = useState<File | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    // State for tasks
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoadingTasks, setIsLoadingTasks] = useState(false)

    // State for document types
    const [documentTypes, setDocumentTypes] = useState<string[]>(initialDocumentTypes)
    const [isAddingNewType, setIsAddingNewType] = useState(false)
    const [newDocumentType, setNewDocumentType] = useState("")

    // Fetch tasks when project changes
    useEffect(() => {
        const fetchTasks = async () => {
            if (!selectedProjectId) return

            try {
                setIsLoadingTasks(true)
                const fetchedTasks = await getTasks(selectedProjectId)
                console.log("fetchedTasks: ", fetchedTasks)
                setTasks(fetchedTasks)
            } catch (error) {
                console.error("Error fetching tasks:", error)
                toast({
                    title: "Error",
                    description: "Failed to load tasks for this project.",
                    variant: "destructive",
                })
            } finally {
                setIsLoadingTasks(false)
            }
        }

        if (isOpen && selectedProjectId) {
            fetchTasks()
        }
    }, [isOpen, selectedProjectId, toast])

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (isOpen) {
            setSelectedTask("none")
            setDocumentName("")
            setDocumentType("none")
            setTags("")
            setDescription("")
            setFile(null)
            setUploadProgress(0)
            setIsAddingNewType(false)
            setNewDocumentType("")
        }
    }, [isOpen])

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)

            // Auto-fill name if not already set
            if (!documentName) {
                setDocumentName(selectedFile.name)
            }
        }
    }

    // Handle drag and drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0]
            setFile(droppedFile)

            // Auto-fill name if not already set
            if (!documentName) {
                setDocumentName(droppedFile.name)
            }
        }
    }

    // Handle adding new document type
    const handleAddNewType = () => {
        if (newDocumentType.trim()) {
            // Add the new type to the list if it doesn't already exist
            if (!documentTypes.includes(newDocumentType.trim())) {
                setDocumentTypes((prev) => [...prev, newDocumentType.trim()])
            }

            // Select the new type
            setDocumentType(newDocumentType.trim())

            // Reset the new type form
            setIsAddingNewType(false)
            setNewDocumentType("")
        }
    }

    // Handle form submission
    const handleUpload = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        if (!file || !selectedProjectId || !user) {
            toast({
                title: "Missing information",
                description: "Please fill in all required fields and select a file.",
                variant: "destructive",
            })
            return
        }

        if (documentType === "none") {
            toast({
                title: "Missing document type",
                description: "Please select a document type.",
                variant: "destructive",
            })
            return
        }

        setIsUploading(true)

        try {
            // Parse tags
            const tagsList = tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag)

            // Upload document
            await uploadDocument(
                file,
                {
                    name: documentName || file.name,
                    description,
                    projectId: selectedProjectId,
                    taskId: selectedTask !== "none" ? selectedTask : undefined,
                    tags: tagsList,
                    uploadedBy: {
                        id: user.uid,
                        name: userProfile?.displayName || user.displayName || user.email || "User",
                        email: user.email || "",
                    },
                    type: documentType,
                },
                (progress) => {
                    setUploadProgress(progress)
                },
            )

            toast({
                title: "Document uploaded",
                description: "Your document has been uploaded successfully.",
            })

            // Close dialog and refresh documents
            onClose()
            onUploadComplete()
        } catch (error) {
            console.error("Error uploading document:", error)
            toast({
                title: "Upload failed",
                description: "Failed to upload document. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Upload New Document</DialogTitle>
                    <DialogDescription>Upload a document and associate it with a specific task.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleUpload} className="max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="task" className="text-right">
                                Task
                            </Label>
                            <div className="col-span-3">
                                <Select value={selectedTask} onValueChange={setSelectedTask} disabled={isLoadingTasks}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingTasks ? "Loading tasks..." : "Select task"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No task</SelectItem>
                                        {tasks.map((task) => (
                                            <SelectItem key={task.id} value={task.id}>
                                                {task.taskId ? `${task.taskId}: ${task.title}` : task.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="documentName" className="text-right">
                                Document Name
                            </Label>
                            <Input
                                id="documentName"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                placeholder="Enter document name (or use filename)"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="documentType" className="text-right">
                                Document Type
                            </Label>
                            {isAddingNewType ? (
                                <div className="col-span-3 flex gap-2">
                                    <Input
                                        id="newDocumentType"
                                        value={newDocumentType}
                                        onChange={(e) => setNewDocumentType(e.target.value)}
                                        placeholder="Enter new document type"
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" onClick={handleAddNewType}>
                                        Add
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setIsAddingNewType(false)
                                            setNewDocumentType("")
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            ) : (
                                <div className="col-span-3 flex gap-2">
                                    <Select value={documentType} onValueChange={setDocumentType} className="flex-1">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {documentTypes.map((type) => (
                                                <SelectItem key={type} value={type}>
                                                    {type}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="outline" onClick={() => setIsAddingNewType(true)}>
                                        Add New Type
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="tags" className="text-right">
                                Tags
                            </Label>
                            <Input
                                id="tags"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="Enter tags separated by commas"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="uploadedBy" className="text-right">
                                Uploaded By
                            </Label>
                            <Input
                                id="uploadedBy"
                                value={userProfile?.displayName || user?.displayName || user?.email || ""}
                                readOnly
                                placeholder="Your name"
                                className="col-span-3"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">
                                Description
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Add a description"
                                className="col-span-3"
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="file" className="text-right pt-2">
                                File
                            </Label>
                            <div className="col-span-3">
                                <div className="flex items-center justify-center w-full">
                                    <label
                                        htmlFor="dropzone-file"
                                        className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-muted bg-muted/30"
                                            }`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            {file ? (
                                                <>
                                                    <FileText className="w-8 h-8 mb-3 text-green-600" />
                                                    <p className="mb-2 text-sm font-semibold">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground">
                                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, PNG, JPG (MAX. 20MB)</p>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            id="dropzone-file"
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={onClose} disabled={isUploading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!file || isUploading} className="bg-gray-500 hover:bg-gray-600">
                            {isUploading ? "Uploading..." : "Upload Document"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
