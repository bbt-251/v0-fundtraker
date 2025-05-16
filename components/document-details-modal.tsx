"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateDocument } from "@/services/document-service"
import type { Document } from "@/types/document"
import { formatFileSize } from "@/lib/utils/file-utils"

interface DocumentDetailsModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (updatedDoc: Document) => void
}

export function DocumentDetailsModal({ document, isOpen, onClose, onUpdate }: DocumentDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(document?.name || "")
  const [description, setDescription] = useState(document?.description || "")
  const [tags, setTags] = useState(document?.tags?.join(", ") || "")
  const [status, setStatus] = useState(document?.status || "draft")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when document changes
  if (document && document.name !== name && !isEditing) {
    setName(document.name)
    setDescription(document.description || "")
    setTags(document.tags?.join(", ") || "")
    setStatus(document.status || "draft")
  }

  const handleSave = async () => {
    if (!document) return

    setIsSubmitting(true)
    try {
      const updatedData = {
        name,
        description,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        status: status as "draft" | "final" | "archived",
      }

      await updateDocument(document.id, updatedData)

      onUpdate({
        ...document,
        ...updatedData,
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating document:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!document) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Document" : "Document Details"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isEditing ? (
            // Edit mode
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Document Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </>
          ) : (
            // View mode
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium">Name:</div>
                <div className="col-span-2">{document.name}</div>

                <div className="font-medium">Type:</div>
                <div className="col-span-2">{document.fileType}</div>

                <div className="font-medium">Size:</div>
                <div className="col-span-2">{formatFileSize(document.fileSize)}</div>

                <div className="font-medium">Uploaded:</div>
                <div className="col-span-2">{new Date(document.uploadedAt).toLocaleString()}</div>

                <div className="font-medium">Uploaded By:</div>
                <div className="col-span-2">{document.uploadedBy}</div>

                <div className="font-medium">Status:</div>
                <div className="col-span-2">
                  <span
                    className={`capitalize ${
                      document.status === "final"
                        ? "text-green-600"
                        : document.status === "archived"
                          ? "text-gray-500"
                          : "text-amber-600"
                    }`}
                  >
                    {document.status || "Draft"}
                  </span>
                </div>

                {document.version && (
                  <>
                    <div className="font-medium">Version:</div>
                    <div className="col-span-2">{document.version}</div>
                  </>
                )}

                {document.lastModified && (
                  <>
                    <div className="font-medium">Last Modified:</div>
                    <div className="col-span-2">{new Date(document.lastModified).toLocaleString()}</div>
                  </>
                )}

                {document.description && (
                  <>
                    <div className="font-medium">Description:</div>
                    <div className="col-span-2">{document.description}</div>
                  </>
                )}

                {document.tags && document.tags.length > 0 && (
                  <>
                    <div className="font-medium">Tags:</div>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {document.tags.map((tag, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setIsEditing(true)}>Edit</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
