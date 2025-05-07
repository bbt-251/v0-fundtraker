"use client"

import type React from "react"

import { useState } from "react"
import { Upload, X, FileText } from "lucide-react"

interface FileUploadProps {
  label: string
  type: "business" | "tax" | "additional"
  required?: boolean
  files: File[]
  onAddFiles: (files: File[]) => void
  onRemoveFile: (fileName: string) => void
}

export function FileUpload({ label, type, required = false, files, onAddFiles, onRemoveFile }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      onAddFiles(newFiles)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files)
    onAddFiles(newFiles)

    // Reset the input
    e.target.value = ""
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${
          isDragging
            ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-700 border-dashed"
        } rounded-md transition-colors`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-1 text-center">
          <Upload
            className={`mx-auto h-12 w-12 ${isDragging ? "text-blue-500 dark:text-blue-400" : "text-gray-400"}`}
          />
          <div className="flex text-sm text-gray-600 dark:text-gray-400">
            <label
              htmlFor={`${type}-docs`}
              className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none"
            >
              <span>Upload files</span>
              <input
                id={`${type}-docs`}
                name={`${type}-docs`}
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                multiple
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">PDF, PNG, JPG, GIF up to 10MB</p>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="mt-2 divide-y divide-gray-200 dark:divide-gray-700">
          {files.map((file, index) => (
            <li key={index} className="py-2 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
              </div>
              <button type="button" onClick={() => onRemoveFile(file.name)} className="text-red-500 hover:text-red-700">
                <X className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
