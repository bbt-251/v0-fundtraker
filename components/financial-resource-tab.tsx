"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { HumanResource, MaterialResource, FundAccount, ProjectMilestone } from "@/types/project"
import { ChevronLeft, ChevronRight, Edit, Trash2, ArrowLeft, FileText, Loader2, Plus, Pencil } from "lucide-react"
import { FundAccountModal, type FundAccountData } from "./fund-account-modal"
import {
  addFundAccount,
  updateFundAccount,
  deleteFundAccount,
  getProject,
  updateProjectCost,
  addMilestoneBudget,
  updateMilestoneBudget,
} from "@/services/project-service"
import { MilestoneBudgetModal } from "./milestone-budget-modal"

interface FinancialResourceTabProps {
  projectId: string
  humanResources: HumanResource[]
  materialResources: MaterialResource[]
}

export interface MilestoneBudget {
  id: string
  milestoneId: string
  milestoneName: string
  dueDate: string
  budget: number
  status: "Planned" | "In-progress" | "Completed"
}

export function FinancialResourceTab({ projectId, humanResources, materialResources }: FinancialResourceTabProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showFundAccountSetup, setShowFundAccountSetup] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false) // Fixed: Initialize with false instead of self-reference
  const [currentAccount, setCurrentAccount] = useState<FundAccountData | undefined>(undefined)
  const [fundAccounts, setFundAccounts] = useState<FundAccount[]>([])
  const [projectMilestones, setProjectMilestones] = useState<ProjectMilestone[]>([])
  const [milestoneBudgets, setMilestoneBudgets] = useState<MilestoneBudget[]>([])
  const [isMilestoneBudgetModalOpen, setIsMilestoneBudgetModalOpen] = useState(false)
  const [currentMilestoneBudget, setCurrentMilestoneBudget] = useState<MilestoneBudget | undefined>(undefined)
  const [totalProjectCost, setTotalProjectCost] = useState(0)

  // Fetch fund accounts when component mounts
  useEffect(() => {
    const fetchFundAccounts = async () => {
      try {
        setLoading(true)
        const project = await getProject(projectId)
        setFundAccounts(project.fundAccounts || [])
        setMilestoneBudgets(project.milestoneBudgets || [])

        // Fetch project milestones
        const milestones = project.milestones || []
        setProjectMilestones(milestones)
      } catch (error: any) {
        setError(error.message || "Failed to fetch fund accounts")
      } finally {
        setLoading(false)
      }
    }

    fetchFundAccounts()
  }, [projectId])

  // Update project cost when resources change
  useEffect(() => {
    const updateCost = async () => {
      try {
        const humanResourceTotal = calculateHumanResourceTotal()
        const materialResourceTotal = calculateMaterialResourceTotal()
        const totalCost = humanResourceTotal + materialResourceTotal

        setTotalProjectCost(totalCost)

        // Update the project cost in the database
        await updateProjectCost(projectId, totalCost)
      } catch (error: any) {
        console.error("Error updating project cost:", error)
      }
    }

    updateCost()
  }, [projectId, humanResources, materialResources])

  const itemsPerPage = 6

  // Calculate total costs
  const calculateHumanResourceCost = (resource: HumanResource) => {
    return resource.costPerDay * resource.quantity * 30 // Assuming 30 days as default
  }

  const calculateMaterialResourceCost = (resource: MaterialResource) => {
    // For one-time costs, just return the amount
    if (resource.costType === "one-time") {
      return resource.costAmount
    }
    // For recurring costs, calculate based on amortization period (assuming 30 days as default)
    return (resource.costAmount * 30) / resource.amortizationPeriod
  }

  // Calculate totals
  const calculateHumanResourceTotal = () => {
    return humanResources.reduce((total, resource) => {
      return total + calculateHumanResourceCost(resource)
    }, 0)
  }

  const calculateMaterialResourceTotal = () => {
    return materialResources.reduce((total, resource) => {
      return total + calculateMaterialResourceCost(resource)
    }, 0)
  }

  const humanResourceTotal = calculateHumanResourceTotal()
  const materialResourceTotal = calculateMaterialResourceTotal()
  const totalCost = humanResourceTotal + materialResourceTotal

  // Prepare combined resources for the table
  const combinedResources = [
    ...humanResources.map((resource) => ({
      id: resource.id,
      name: resource.role,
      type: "Human Resource",
      dailyCost: resource.costPerDay,
      quantity: resource.quantity,
      days: 30, // Default to 30 days
      totalCost: calculateHumanResourceCost(resource),
    })),
    ...materialResources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      type: resource.type,
      dailyCost:
        resource.costType === "one-time" ? resource.costAmount / 30 : resource.costAmount / resource.amortizationPeriod,
      quantity: 1, // Default quantity for materials
      days: 30, // Default to 30 days
      totalCost: calculateMaterialResourceCost(resource),
    })),
  ]

  // Pagination
  const totalPages = Math.ceil(combinedResources.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedResources = combinedResources.slice(startIndex, startIndex + itemsPerPage)

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Calculate percentages
  const humanResourcePercentage = totalCost > 0 ? (humanResourceTotal / totalCost) * 100 : 0
  const materialResourcePercentage = totalCost > 0 ? (materialResourceTotal / totalCost) * 100 : 0

  // Toggle to Fund Account Setup view
  const handleFundAccountSetup = () => {
    setShowFundAccountSetup(true)
  }

  // Go back to cost summary view
  const handleBack = () => {
    setShowFundAccountSetup(false)
  }

  // Handle Fund Account Request
  const handleFundAccountRequest = () => {
    setIsModalOpen(true)
    setIsEditing(false)
    setCurrentAccount(undefined)
  }

  // Handle edit bank account request
  const handleEditRequest = (id: string) => {
    const accountToEdit = fundAccounts.find((account) => account.id === id)
    if (accountToEdit) {
      setCurrentAccount({
        id: accountToEdit.id,
        accountName: accountToEdit.accountName,
        accountType: accountToEdit.accountType,
        bankName: accountToEdit.bankName,
        accountOwnerName: accountToEdit.accountOwnerName,
        status: accountToEdit.status,
      })
      setIsEditing(true)
      setIsModalOpen(true)
    }
  }

  // Handle delete bank account request
  const handleDeleteRequest = async (id: string) => {
    try {
      setLoading(true)
      await deleteFundAccount(projectId, id)
      setFundAccounts(fundAccounts.filter((account) => account.id !== id))
      setError("")
    } catch (error: any) {
      setError(error.message || "Failed to delete fund account")
    } finally {
      setLoading(false)
    }
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  // Handle form submission
  const handleSubmitAccount = async (accountData: FundAccountData) => {
    try {
      setLoading(true)
      setError("")

      if (isEditing && accountData.id) {
        // Update existing account
        const { id, ...updates } = accountData
        const updatedAccount = await updateFundAccount(projectId, id, updates)

        // Update local state
        setFundAccounts(fundAccounts.map((account) => (account.id === id ? updatedAccount : account)))
      } else {
        // Add new account
        const newAccount = await addFundAccount(projectId, {
          ...accountData,
          status: "Pending",
        })

        // Update local state
        setFundAccounts([...fundAccounts, newAccount])
      }

      setIsModalOpen(false)
    } catch (error: any) {
      setError(error.message || "Failed to save fund account")
    } finally {
      setLoading(false)
    }
  }

  // Handle add milestone budget
  const handleAddMilestoneBudget = () => {
    setCurrentMilestoneBudget(undefined)
    setIsMilestoneBudgetModalOpen(true)
  }

  // Handle edit milestone budget
  const handleEditMilestoneBudget = (id: string) => {
    const budgetToEdit = milestoneBudgets.find((budget) => budget.id === id)
    if (budgetToEdit) {
      setCurrentMilestoneBudget(budgetToEdit)
      setIsMilestoneBudgetModalOpen(true)
    }
  }

  // Handle milestone budget modal close
  const handleMilestoneBudgetModalClose = () => {
    setIsMilestoneBudgetModalOpen(false)
  }

  // Handle milestone budget submission
  const handleSubmitMilestoneBudget = async (budgetData: MilestoneBudget) => {
    try {
      setLoading(true)
      setError("")

      if (currentMilestoneBudget?.id) {
        // Update existing milestone budget
        // Make sure we're using the ID from currentMilestoneBudget, not from budgetData
        const updatedBudget = await updateMilestoneBudget(projectId, {
          ...budgetData,
          id: currentMilestoneBudget.id,
        })

        // Update local state
        setMilestoneBudgets(
          milestoneBudgets.map((budget) => (budget.id === currentMilestoneBudget.id ? updatedBudget : budget)),
        )
      } else {
        // Add new milestone budget
        const newBudget = await addMilestoneBudget(projectId, budgetData)

        // Update local state
        setMilestoneBudgets([...milestoneBudgets, newBudget])
      }

      setIsMilestoneBudgetModalOpen(false)
    } catch (error: any) {
      setError(error.message || "Failed to save milestone budget")
    } finally {
      setLoading(false)
    }
  }

  // Calculate total milestone budget
  const totalMilestoneBudget = milestoneBudgets.reduce((total, budget) => total + budget.budget, 0)

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Financial Resources</h2>
        {!showFundAccountSetup ? (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleFundAccountSetup}>
            <span className="mr-2">Fund Account Setup</span>
          </Button>
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleFundAccountRequest}>
              <FileText className="h-4 w-4 mr-2" />
              Fund Account Request
            </Button>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && !showFundAccountSetup ? (
        // Cost Summary View
        <>
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Project Cost Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Total Project Cost */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Total Project Cost</h4>
                  <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-2">
                    {formatCurrency(totalCost)}
                  </p>
                </CardContent>
              </Card>

              {/* Human Resources Cost */}
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-300">Human Resources</h4>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-300 mt-2">
                    {formatCurrency(humanResourceTotal)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {humanResourcePercentage.toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>

              {/* Material Resources Cost */}
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
                <CardContent className="p-6">
                  <h4 className="text-sm font-medium text-purple-800 dark:text-purple-300">Material Resources</h4>
                  <p className="text-2xl font-bold text-purple-800 dark:text-purple-300 mt-2">
                    {formatCurrency(materialResourceTotal)}
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    {materialResourcePercentage.toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Cost Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Resource Name
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Type
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Daily Cost
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Quantity
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Days
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                      Total Cost
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedResources.length > 0 ? (
                    paginatedResources.map((resource, index) => (
                      <tr
                        key={resource.id}
                        className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                      >
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{resource.name}</td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{resource.type}</td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                          {formatCurrency(resource.dailyCost)}
                        </td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{resource.quantity}</td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{resource.days}</td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                          {formatCurrency(resource.totalCost)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-4 px-4 text-center border-b border-gray-200 dark:border-gray-700">
                        No resources found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {combinedResources.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                  <span className="font-medium">{Math.min(startIndex + itemsPerPage, combinedResources.length)}</span>{" "}
                  of <span className="font-medium">{combinedResources.length}</span> resources
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Fund Release Workflow */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Fund Release Workflow</h3>
              <Button onClick={handleAddMilestoneBudget}>
                <Plus className="h-4 w-4 mr-2" />
                Add a Milestone
              </Button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Milestone
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Due Date
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Budget
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        % of Total
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Status
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestoneBudgets.length > 0 ? (
                      milestoneBudgets.map((budget, index) => {
                        const percentOfTotal = totalCost > 0 ? (budget.budget / totalCost) * 100 : 0

                        return (
                          <tr
                            key={budget.id}
                            className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                          >
                            <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                              {budget.milestoneName}
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                              {new Date(budget.dueDate).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700 font-medium">
                              {formatCurrency(budget.budget)}
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                              {percentOfTotal.toFixed(0)}%
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  budget.status === "Completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                    : budget.status === "In-progress"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {budget.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                              <button
                                onClick={() => handleEditMilestoneBudget(budget.id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 px-4 text-center border-b border-gray-200 dark:border-gray-700">
                          No milestone budgets found
                        </td>
                      </tr>
                    )}
                    {milestoneBudgets.length > 0 && (
                      <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">Total</td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700"></td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                          {formatCurrency(totalMilestoneBudget)}
                        </td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                          {totalCost > 0 ? ((totalMilestoneBudget / totalCost) * 100).toFixed(0) : 0}%
                        </td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700"></td>
                        <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : !loading && showFundAccountSetup ? (
        // Fund Account Setup View
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Bank Account Requests</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Account Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Bank Name
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Account Type
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {fundAccounts.length > 0 ? (
                  fundAccounts.map((account, index) => (
                    <tr
                      key={account.id}
                      className={index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
                    >
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{account.accountName}</td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{account.bankName}</td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">{account.accountType}</td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            account.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : account.status === "Approved"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRequest(account.id)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            disabled={loading}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(account.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 px-4 text-center border-b border-gray-200 dark:border-gray-700">
                      No bank account requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Fund Account Modal */}
      <FundAccountModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleSubmitAccount}
        initialData={currentAccount}
        isEditing={isEditing}
      />

      {/* Milestone Budget Modal */}
      <MilestoneBudgetModal
        isOpen={isMilestoneBudgetModalOpen}
        onClose={handleMilestoneBudgetModalClose}
        onSubmit={handleSubmitMilestoneBudget}
        initialData={currentMilestoneBudget}
        projectMilestones={projectMilestones}
        totalProjectCost={totalProjectCost}
        existingBudgets={milestoneBudgets}
      />
    </div>
  )
}
