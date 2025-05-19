"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import {
  getDocuments,
  deleteDocument,
  viewDocument,
  downloadDocument,
  getDocumentStatistics,
  formatFileSize,
} from "@/services/document-service"
import { getProjectsByOwner } from "@/services/project-service"
import { getTasks } from "@/services/task-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  FileText,
  Download,
  Eye,
  Edit,
  Share,
  Trash2,
  MoreHorizontal,
  Upload,
  Search,
  File,
  FileImage,
  FileSpreadsheet,
  FileCog,
  Plus,
} from "lucide-react"
import { ConfirmationModal } from "@/components/confirmation-modal"
import type { Document, DocumentFilter, DocumentStatistics } from "@/types/document"
import type { Project } from "@/types/project"
import type { Task } from "@/types/task"

export default function DocumentManagement() {
  const { user } = useAuth()
  const { toast } = useToast()

  // State for documents and projects
  const [documents, setDocuments] = useState<Document[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [statistics, setStatistics] = useState<DocumentStatistics | null>(null)

  // State for selected filters
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [selectedTaskId, setSelectedTaskId] = useState<string>("all")
  const [selectedDocType, setSelectedDocType] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // State for modals
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentDetailsOpen, setDocumentDetailsOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (!user || !user.uid) {
          console.log("No user found, skipping project fetch")
          return
        }

        // Use getProjectsByOwner instead of getProjects and pass the user ID
        const fetchedProjects = await getProjectsByOwner(user.uid)
        setProjects(fetchedProjects)

        // Select the first project by default if none is selected
        if (fetchedProjects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(fetchedProjects[0].id)
        }
      } catch (error) {
        console.error("Error fetching projects:", error)
        toast({
          title: "Error",
          description: "Failed to load projects. Please try again.",
          variant: "destructive",
        })
      }
    }

    fetchProjects()
  }, [user, toast, selectedProjectId])

  // Fetch tasks when project changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!selectedProjectId) return

        const fetchedTasks = await getTasks(selectedProjectId)
        setTasks(fetchedTasks)
      } catch (error) {
        console.error("Error fetching tasks:", error)
      }
    }

    if (selectedProjectId) {
      fetchTasks()
    }
  }, [selectedProjectId])

  // Fetch documents and statistics when filters change
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true)

        if (!selectedProjectId) {
          setDocuments([])
          setStatistics(null)
          return
        }

        // Prepare filter
        const filter: DocumentFilter = {
          projectId: selectedProjectId,
          status: "active",
        }

        if (selectedTaskId !== "all") {
          filter.taskId = selectedTaskId
        }

        if (selectedDocType !== "all") {
          filter.fileType = selectedDocType
        }

        if (searchQuery) {
          filter.searchQuery = searchQuery
        }

        // Fetch documents
        const fetchedDocuments = await getDocuments(filter)
        setDocuments(fetchedDocuments)

        // Fetch statistics
        const stats = await getDocumentStatistics(selectedProjectId)
        setStatistics(stats)
      } catch (error) {
        console.error("Error fetching documents:", error)
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDocuments()
  }, [selectedProjectId, selectedTaskId, selectedDocType, searchQuery, toast])

  // Handle document actions
  const handleViewDocument = async (document: Document) => {
    if (!user) return

    setIsActionLoading(true)

    try {
      const url = await viewDocument(document.id, user.uid, user.displayName || user.email || "User")

      if (url) {
        window.open(url, "_blank")

        toast({
          title: "Document opened",
          description: "The document has been opened in a new tab.",
        })
      } else {
        throw new Error("Failed to get document URL")
      }
    } catch (error) {
      console.error("Error viewing document:", error)
      toast({
        title: "Error",
        description: "Failed to open the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDownloadDocument = async (document: Document) => {
    if (!user) return

    setIsActionLoading(true)

    try {
      const url = await downloadDocument(document.id, user.uid, user.displayName || user.email || "User")

      if (url) {
        // Create a temporary link to trigger download
        const a = document.createElement("a")
        a.href = url
        a.download = document.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)

        toast({
          title: "Download started",
          description: "Your document is being downloaded.",
        })
      } else {
        throw new Error("Failed to get document URL")
      }
    } catch (error) {
      console.error("Error downloading document:", error)
      toast({
        title: "Error",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!user || !documentToDelete) return

    setIsActionLoading(true)

    try {
      const success = await deleteDocument(documentToDelete.id, user.uid, user.displayName || user.email || "User")

      if (success) {
        // Remove document from state
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentToDelete.id))

        toast({
          title: "Document deleted",
          description: "The document has been deleted successfully.",
        })

        // Refresh statistics
        if (selectedProjectId) {
          const stats = await getDocumentStatistics(selectedProjectId)
          setStatistics(stats)
        }
      } else {
        throw new Error("Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Error",
        description: "Failed to delete the document. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
      setDeleteDialogOpen(false)
      setDocumentToDelete(null)
    }
  }

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return <FileImage className="h-5 w-5" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel") || fileType.includes("csv"))
      return <FileSpreadsheet className="h-5 w-5" />
    if (fileType.includes("json") || fileType.includes("xml") || fileType.includes("code"))
      return <FileCog className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  // Format date for display
  const formatDate = (timestamp: any) => {
    try {
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString()
      }

      if (typeof timestamp === "string") {
        return new Date(timestamp).toLocaleDateString()
      }

      if (timestamp && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString()
      }

      return "Unknown date"
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Document Management</h2>
          <p className="text-muted-foreground">Manage and organize project documents</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name || project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProjectId && (
            <>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by task" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tasks</SelectItem>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  className="pl-8 w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </>
          )}
        </div>
      </div>

      {!selectedProjectId ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <File className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Selected</h3>
          <p className="text-muted-foreground mb-4">Please select a project to view and manage documents.</p>
        </div>
      ) : isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Loading documents...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                  <div>
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>
                {documents.length} document{documents.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-8">
                  <File className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium mb-1">No documents found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "No documents match your search criteria."
                      : selectedTaskId !== "all"
                        ? "No documents found for the selected task."
                        : "Get started by uploading a document."}
                  </p>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium">Name</th>
                        <th className="text-left py-3 font-medium">Task</th>
                        <th className="text-left py-3 font-medium">Type</th>
                        <th className="text-left py-3 font-medium">Size</th>
                        <th className="text-left py-3 font-medium">Uploaded</th>
                        <th className="text-right py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const task = tasks.find((t) => t.id === doc.taskId)

                        return (
                          <tr key={doc.id} className="border-b">
                            <td className="py-3">
                              <div className="flex items-center">
                                {getFileIcon(doc.fileType)}
                                <span className="ml-2 font-medium">{doc.name}</span>
                              </div>
                            </td>
                            <td className="py-3">{task ? task.title : "No task"}</td>
                            <td className="py-3">
                              <Badge variant="outline">{doc.fileType.split("/")[1] || doc.fileType}</Badge>
                            </td>
                            <td className="py-3">{formatFileSize(doc.fileSize)}</td>
                            <td className="py-3">
                              <div>
                                <div>{formatDate(doc.uploadedAt)}</div>
                                <div className="text-xs text-muted-foreground">{doc.uploadedBy.name}</div>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDocument(doc)}
                                  disabled={isActionLoading}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDownloadDocument(doc)}
                                  disabled={isActionLoading}
                                >
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Download</span>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">More</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadDocument(doc)}>
                                      <Download className="mr-2 h-4 w-4" />
                                      Download
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc)
                                        setDocumentDetailsOpen(true)
                                      }}
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        navigator.clipboard.writeText(doc.fileUrl)
                                        toast({
                                          title: "Link copied",
                                          description: "Document link copied to clipboard",
                                        })
                                      }}
                                    >
                                      <Share className="mr-2 h-4 w-4" />
                                      Copy Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => {
                                        setDocumentToDelete(doc)
                                        setDeleteDialogOpen(true)
                                      }}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {statistics && documents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Document Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.documentsByType.map((type) => (
                      <div key={type.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{type.name}</span>
                          <span>{type.count}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full bg-primary rounded-full`} style={{ width: `${type.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Documents by Task</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.documentsByTask.length > 0 ? (
                      statistics.documentsByTask.map((task) => (
                        <div key={task.taskId} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{task.taskName}</span>
                            <span>{task.count}</span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${task.percentage}%` }} />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No documents assigned to tasks</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statistics.recentActivity.length > 0 ? (
                      statistics.recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className="rounded-full bg-primary/10 p-2">
                            {activity.actionType === "upload" && <Upload className="h-4 w-4 text-primary" />}
                            {activity.actionType === "view" && <Eye className="h-4 w-4 text-primary" />}
                            {activity.actionType === "download" && <Download className="h-4 w-4 text-primary" />}
                            {activity.actionType === "edit" && <Edit className="h-4 w-4 text-primary" />}
                            {activity.actionType === "delete" && <Trash2 className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {activity.actionBy.name} {activity.actionType}ed a document
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(activity.actionDate)}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No recent activity</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false)
          setDocumentToDelete(null)
        }}
        onConfirm={handleDeleteDocument}
        title="Delete Document"
        message={`Are you sure you want to delete "${documentToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isActionLoading}
      />
    </div>
  )
}
