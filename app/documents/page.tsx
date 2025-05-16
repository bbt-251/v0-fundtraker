"use client"
import { DocumentManagement } from "@/components/document-management"

export default function DocumentsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Document Management</h1>
      <DocumentManagement />
    </div>
  )
}
