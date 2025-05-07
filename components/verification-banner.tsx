"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { AlertCircle, X } from "lucide-react"
import Link from "next/link"

export function VerificationBanner() {
  const { userProfile } = useAuth()
  const [dismissed, setDismissed] = useState(false)

  // Don't show banner if user is verified, has no profile, or banner was dismissed
  if (!userProfile || userProfile.verified || dismissed) {
    return null
  }

  // Show different messages based on verification status
  let message = ""
  let actionText = ""

  if (!userProfile.completedProfile) {
    message = "Please complete your profile information to proceed with verification."
    actionText = "Complete Profile"
  } else if (!userProfile.submittedVerification) {
    message = "Please upload your verification documents to complete the verification process."
    actionText = "Upload Documents"
  } else if (userProfile.verificationStatus === "pending") {
    message = "Your account verification is pending review by a Platform Governor."
    actionText = "View Status"
  } else if (userProfile.verificationStatus === "rejected") {
    message = "Your verification was rejected. Please upload new documents."
    actionText = "Update Documents"
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap">
          <div className="flex-1 flex items-center">
            <span className="flex p-2 rounded-lg bg-amber-100 dark:bg-amber-800">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </span>
            <p className="ml-3 font-medium text-amber-700 dark:text-amber-300 truncate">
              <span className="md:hidden">{message}</span>
              <span className="hidden md:inline">{message}</span>
            </p>
          </div>
          <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
            <Link
              href="/account"
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-amber-600 dark:text-amber-200 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-gray-700"
            >
              {actionText}
            </Link>
          </div>
          <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="-mr-1 flex p-2 rounded-md hover:bg-amber-100 dark:hover:bg-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-600 dark:focus:ring-amber-400"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
