"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingAnimation } from "@/components/loading-animation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Mark component as mounted to ensure client-side only execution
    setMounted(true)

    // If user is already logged in, redirect to dashboard immediately
    if (user) {
      router.push("/dashboard")
      return
    }

    // Otherwise, show loading animation for 3 seconds
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [user, router])

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqs = [
    {
      question: "How does FundTracker ensure transparency in fund management?",
      answer:
        "FundTracker provides complete visibility into every financial transaction with detailed audit trails. Our platform tracks funds from initial allocation through milestone-based disbursements, with real-time reporting and documentation requirements that ensure all stakeholders can see exactly how money is being used.",
    },
    {
      question: "Can FundTracker be used for both investment funds and donations?",
      answer:
        "Yes, FundTracker is designed to handle various types of funding, including investment funds, donations, grants, and project-based funding. The platform's flexible structure allows you to customize workflows and reporting to meet the specific requirements of different funding types and regulatory environments.",
    },
    {
      question: "How does the milestone-based disbursement work?",
      answer:
        "Our milestone-based disbursement system allows you to define specific project milestones with clear deliverables and timelines. Funds are only released when these predefined milestones are verified as complete, ensuring accountability and proper fund utilization. This can be configured for automatic releases or to require manual approval from designated stakeholders.",
    },
    {
      question: "Is FundTracker secure for financial data?",
      answer:
        "Absolutely. FundTracker implements bank-level security protocols including end-to-end encryption, multi-factor authentication, and regular security audits. We comply with industry standards for financial data protection and maintain strict access controls to ensure your sensitive information remains secure at all times.",
    },
    {
      question: "Can multiple stakeholders access the platform?",
      answer:
        "Yes, FundTracker supports multiple user roles with customizable permission levels. You can provide appropriate access to investors, donors, project managers, beneficiaries, and other stakeholders, controlling exactly what information each user can view or modify within the system.",
    },
    {
      question: "How quickly can we get started with FundTracker?",
      answer:
        "Most organizations can be up and running with FundTracker in less than a day. Our intuitive setup process guides you through configuring your account, and our team provides comprehensive onboarding support. There's no complex integration required, and you can start tracking your first project immediately after signing up.",
    },
  ]

  // Don't render anything until client-side hydration is complete
  if (!mounted) {
    return null
  }

  if (loading) {
    return <LoadingAnimation />
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="text-center max-w-3xl">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-600 text-white p-3 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-file-text"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" x2="8" y1="13" y2="13" />
              <line x1="16" x2="8" y1="17" y2="17" />
              <line x1="10" x2="8" y1="9" y2="9" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold ml-2">FundTracker</h1>
        </div>

        <h2 className="text-4xl font-bold mb-4">Make Every Penny Transparent and Accountable</h2>
        <p className="text-xl text-gray-600 mb-8">
          FundTracker helps you manage funds with complete transparency, showing exactly where each penny is allocated
          through milestone-based disbursement workflows.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign Up
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
