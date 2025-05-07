"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { getProjectById } from "@/services/project-service"
import { createDonation, completeDonation } from "@/services/donation-service"
import type { Project } from "@/types/project"
import { useAuth } from "@/contexts/auth-context"
import { LoadingAnimation } from "@/components/loading-animation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function DonatePage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const donationSuccess = searchParams.get("success")
  const { user } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [donationAmount, setDonationAmount] = useState<string>("25")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [message, setMessage] = useState<string>("")
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [donorName, setDonorName] = useState<string>("")
  const [donorEmail, setDonorEmail] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setDonorName(user.displayName || "")
      setDonorEmail(user.email || "")
    }
  }, [user])

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const projectData = await getProjectById(id as string)
        setProject(projectData)
      } catch (err: any) {
        setError(err.message || "Failed to fetch project details")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id])

  // Update the handleDonationSubmit function to handle empty values properly

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const amount = donationAmount === "custom" ? Number(customAmount) : Number(donationAmount)

      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid donation amount")
      }

      // Create the donation object with proper null handling
      const donationData: Record<string, any> = {
        projectId: id as string,
        amount,
        isAnonymous,
      }

      // Only add non-empty values
      if (message.trim()) {
        donationData.message = message.trim()
      }

      if (!isAnonymous) {
        if (user?.uid) donationData.userId = user.uid
        if (donorName.trim()) donationData.donorName = donorName.trim()
        if (donorEmail.trim()) donationData.donorEmail = donorEmail.trim()
      }

      // Save donation to database
      const donation = await createDonation(donationData as any)

      // In a real-world app, you would integrate with a payment processor here
      // For now, we'll simulate a successful payment
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Update donation status to completed and update project total
      await completeDonation(donation.id, donation.projectId)

      // Redirect to the project details page with success message
      router.push(`/project-details/${id}?donated=true`)
    } catch (err: any) {
      setError(err.message || "Failed to process donation")
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingAnimation />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p className="mb-4">{error || "Project not found"}</p>
        <Link href="/donor-dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    )
  }

  // Calculate total project cost
  const calculateTotalProjectCost = () => {
    if (project.cost) return project.cost

    const humanCost =
      project.humanResources?.reduce((total, resource) => {
        return total + resource.costPerDay * resource.quantity * 30
      }, 0) || 0

    const materialCost =
      project.materialResources?.reduce((total, resource) => {
        if (resource.costType === "one-time") {
          return total + resource.costAmount
        } else {
          return total + (resource.costAmount * 30) / resource.amortizationPeriod
        }
      }, 0) || 0

    return humanCost + materialCost
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const totalProjectCost = calculateTotalProjectCost()
  const remainingAmount = totalProjectCost - (project.donations || 0)

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="mb-6">
        <Link href={`/project-details/${id}`}>
          <Button variant="outline">← Back to Project</Button>
        </Link>
      </div>

      {donationSuccess === "true" && (
        <Alert className="mb-6" variant="success">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Donation Successful</AlertTitle>
          <AlertDescription>Thank you for supporting this project!</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold">Donate to {project.name}</h1>
        <p className="mb-6 text-gray-500">Your support helps make this project possible.</p>

        <div className="mb-6 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300">Project Funding</p>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                {formatCurrency(project.donations || 0)} of {formatCurrency(totalProjectCost)} raised
              </p>
            </div>
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300">Still needed</p>
              <p className="font-semibold text-blue-800 dark:text-blue-300">
                {formatCurrency(remainingAmount > 0 ? remainingAmount : 0)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleDonationSubmit}>
          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Select Amount</h2>
            <RadioGroup
              value={donationAmount}
              onValueChange={setDonationAmount}
              className="grid grid-cols-2 gap-4 sm:grid-cols-4"
            >
              {["10", "25", "50", "100"].map((amount) => (
                <div key={amount} className="flex items-center space-x-2">
                  <RadioGroupItem value={amount} id={`amount-${amount}`} />
                  <Label htmlFor={`amount-${amount}`}>${amount}</Label>
                </div>
              ))}
              <div className="col-span-2 sm:col-span-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="amount-custom" />
                  <Label htmlFor="amount-custom">Custom Amount</Label>
                </div>
                {donationAmount === "custom" && (
                  <div className="mt-2">
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Donor Information</h2>
            <div className="mb-4 flex items-start space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="anonymous"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Make my donation anonymous
                </Label>
                <p className="text-sm text-muted-foreground">If checked, your name will not be displayed publicly</p>
              </div>
            </div>

            {!isAnonymous && (
              <div className="space-y-3">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="donorName">Name</Label>
                  <Input
                    type="text"
                    id="donorName"
                    placeholder="Your name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                  />
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="donorEmail">Email</Label>
                  <Input
                    type="email"
                    id="donorEmail"
                    placeholder="Your email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="mb-3 text-lg font-semibold">Add a Message (Optional)</h2>
            <Textarea
              placeholder="Add a message of support..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-24"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Complete Donation"}
          </Button>
        </form>
      </div>
    </div>
  )
}
