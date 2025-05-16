"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getDocuments, deleteDocument } from "@/services/document-service"
import { getProjects } from "@/services/project-service"
import { getTasks } from "@/services/task-service"
import { UploadDocumentDialog } from "./upload-document-dialog"
import { DocumentDetailsModal } from "./document-details-modal"
import { ConfirmationModal } from "./confirmation-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LoadingAnimation } from "@/components/loading-animation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  FileText,
  Download,
  Info,
  Edit,
  Share,
  Trash2,
  MoreVertical,
  Upload,
  Search,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileIcon as FilePdf,
  FileArchive,
  FileAudio,
  FileVideo,
  FileQuestion,
} from "lucide-react"
import type { Document, DocumentFilter } from "@/types/document"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

export function DocumentManagement() {
  const { user } = useAuth()

  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedTaskId, setSelectedTaskId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  // Load projects
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectsData = await getProjects()
        setProjects(projectsData)
      } catch (error) {
        console.error("Error loading projects:", error)
      }
    }

    loadProjects()
  }, [])

  // Load tasks when project changes
  useEffect(() => {
    const loadTasks = async () => {
      if (!selectedProjectId) {
        setTasks([])
        return
      }

      try {
        const tasksData = await getTasks(selectedProjectId)
        setTasks(tasksData)
      } catch (error) {
        console.error("Error loading tasks:", error)
      }
    }

    if (selectedProjectId) {
      loadTasks()
    }
  }, [selectedProjectId])

  // Load documents with filters
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true)

        const filter: DocumentFilter = {}
        if (selectedProjectId) filter.projectId = selectedProjectId
        if (selectedTaskId) filter.taskId = selectedTaskId
        if (searchQuery) filter.searchQuery = searchQuery

        const documentsData = await getDocuments(filter)
        setDocuments(documentsData)
      } catch (error) {
        console.error("Error loading documents:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDocuments()
  }, [selectedProjectId, selectedTaskId, searchQuery])

  // Handle document deletion
  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return

    try {
      await deleteDocument(documentToDelete)

      // Remove from list
      setDocuments(documents.filter((doc) => doc.id !== documentToDelete.id))
      setDocumentToDelete(null)
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  // Handle document update
  const handleDocumentUpdate = (updatedDoc: Document) => {
    setDocuments((docs) => docs.map((doc) => (doc.id === updatedDoc.id ? updatedDoc : doc)))
    setSelectedDocument(updatedDoc)
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <FileImage className="h-5 w-5" />
    if (fileType.startsWith("text/")) return <FileText className="h-5 w-5" />
    if (fileType.startsWith("application/pdf")) return <FilePdf className="h-5 w-5" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-5 w-5" />
    if (fileType.includes("zip") || fileType.includes("compressed")) return <FileArchive className="h-5 w-5" />
    if (fileType.startsWith("audio/")) return <FileAudio className="h-5 w-5" />
    if (fileType.startsWith("video/")) return <FileVideo className="h-5 w-5" />
    if (fileType.includes("javascript") || fileType.includes("json") || fileType.includes("html"))
      return <FileCode className="h-5 w-5" />
    return <FileQuestion className="h-5 w-5" />
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"

    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Filters and actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Project filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value)
              setSelectedTaskId("") // Reset task when project changes
            }}
            className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Task filter - only show if project is selected */}
          {selectedProjectId && (
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Tasks</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Upload button */}
        <Button onClick={() => setIsUploadDialogOpen(true)} className="whitespace-nowrap">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Documents table */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingAnimation />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <File className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold">No documents</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery
              ? "No documents match your search criteria."
              : selectedProjectId
                ? "No documents found for the selected project."
                : "Get started by uploading a document."}
          </p>
          <div className="mt-6">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Name</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Task</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => {
                const project = projects.find((p) => p.id === document.projectId)
                const task = tasks.find((t) => t.id === document.taskId)

                return (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {getFileIcon(document.fileType)}
                        <span className="ml-2 truncate">{document.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{project?.name || "-"}</TableCell>
                    <TableCell>{task?.title || "-"}</TableCell>
                    <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                    <TableCell>{new Date(document.uploadedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(document.fileUrl, "_blank")}>
                            <FileText className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = document.fileUrl
                              link.download = document.name
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocument(document)
                              setIsDetailsModalOpen(true)
                            }}
                          >
                            <Info className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocument(document)
                              setIsDetailsModalOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(document.fileUrl)
                              // You could add a toast notification here
                            }}
                          >
                            <Share className="mr-2 h-4 w-4" />
                            Share Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDocumentToDelete(document)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Upload dialog */}
      <UploadDocumentDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        onUploadComplete={() => {
          // Refresh documents
          const loadDocuments = async () => {
            try {
              const filter: DocumentFilter = {}
              if (selectedProjectId) filter.projectId = selectedProjectId
              if (selectedTaskId) filter.taskId = selectedTaskId
              if (searchQuery) filter.searchQuery = searchQuery

              const documentsData = await getDocuments(filter)
              setDocuments(documentsData)
            } catch (error) {
              console.error("Error loading documents:", error)
            }
          }

          loadDocuments()
        }}
        initialProjectId={selectedProjectId}
        initialTaskId={selectedTaskId}
      />

      {/* Document details modal */}
      <DocumentDetailsModal
        document={selectedDocument}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedDocument(null)
        }}
        onUpdate={handleDocumentUpdate}
      />

      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </div>
  )
}
