"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function ReportsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the funds page with the withdrawal tab active
    router.push("/funds?tab=withdrawal")
  }, [router])

  return (
    <div className="flex justify-center items-center h-64">
      <p className="text-gray-500 dark:text-gray-400">Redirecting to fund reports...</p>
    </div>
  )
}
