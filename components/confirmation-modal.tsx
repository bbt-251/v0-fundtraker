"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  cancelText: string
  type?: "danger" | "warning" | "info" | "success"
  isLoading?: boolean
  customContent?: React.ReactNode
  confirmDisabled?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = "warning",
  isLoading = false,
  customContent,
  confirmDisabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen && !isVisible) return null

  const getButtonColorClass = () => {
    switch (type) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
      case "info":
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
      case "success":
        return "bg-green-600 hover:bg-green-700 focus:ring-green-500"
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full z-10 overflow-hidden transform transition-all duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>

          {/* Render custom content if provided */}
          {customContent}
        </div>
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700 gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColorClass()} ${
              isLoading || confirmDisabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading || confirmDisabled}
          >
            {isLoading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
