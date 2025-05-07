"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DisbursementsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the funds page with the disbursement tab active
    router.push("/funds?tab=disbursement")
  }, [router])

  return (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500 dark:text-gray-400">Redirecting to fund disbursements...</p>
    </div>
  )
}
