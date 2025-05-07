"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface FundAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (accountData: FundAccountData) => void
  initialData?: FundAccountData
  isEditing?: boolean
}

export interface FundAccountData {
  id?: string
  accountName: string
  accountType: "Domestic Account" | "Foreign Account"
  bankName: string
  accountOwnerName: string
  status?: "Pending" | "Approved" | "Rejected"
}

export function FundAccountModal({ isOpen, onClose, onSubmit, initialData, isEditing = false }: FundAccountModalProps) {
  const [accountData, setAccountData] = useState<FundAccountData>({
    accountName: "",
    accountType: "Domestic Account",
    bankName: "",
    accountOwnerName: "",
  })

  // Initialize form with initial data if provided (for editing)
  useEffect(() => {
    if (initialData) {
      setAccountData(initialData)
    }
  }, [initialData, isOpen])

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen && !isEditing) {
      setAccountData({
        accountName: "",
        accountType: "Domestic Account",
        bankName: "",
        accountOwnerName: "",
      })
    }
  }, [isOpen, isEditing])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(accountData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden">
      {/* Modal backdrop - covers the entire screen */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md mx-4 sm:mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center mb-4">
          <div className="mr-2 p-1 bg-blue-100 dark:bg-blue-900/30 rounded">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Fund Account Setup</h2>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Request a bank account setup for collecting project funds. The custodian will review and approve your request.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-6">
            {/* Account Name */}
            <div>
              <Label htmlFor="accountName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Name
              </Label>
              <Input
                id="accountName"
                placeholder="Project Fund Account"
                value={accountData.accountName}
                onChange={(e) => setAccountData({ ...accountData, accountName: e.target.value })}
                required
                className="w-full"
              />
            </div>

            {/* Account Type */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Type</Label>
              <RadioGroup
                value={accountData.accountType}
                onValueChange={(value) =>
                  setAccountData({
                    ...accountData,
                    accountType: value as "Domestic Account" | "Foreign Account",
                  })
                }
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Domestic Account" id="domestic" />
                  <Label htmlFor="domestic" className="text-sm">
                    Domestic Account
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Foreign Account" id="foreign" />
                  <Label htmlFor="foreign" className="text-sm">
                    Foreign Account
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Bank Name */}
            <div>
              <Label htmlFor="bankName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bank Name
              </Label>
              <Input
                id="bankName"
                placeholder="Enter bank name"
                value={accountData.bankName}
                onChange={(e) => setAccountData({ ...accountData, bankName: e.target.value })}
                required
                className="w-full"
              />
            </div>

            {/* Account Owner Name */}
            <div>
              <Label
                htmlFor="accountOwnerName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Account Owner Name
              </Label>
              <Input
                id="accountOwnerName"
                placeholder="Enter owner name"
                value={accountData.accountOwnerName}
                onChange={(e) => setAccountData({ ...accountData, accountOwnerName: e.target.value })}
                required
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                {isEditing ? "Update Request" : "Submit Request"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
