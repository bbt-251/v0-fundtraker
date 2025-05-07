"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { addMaterialResource, deleteMaterialResource, updateMaterialResource } from "@/services/project-service"
import type { MaterialResource } from "@/types/project"

interface MaterialResourceTabProps {
  projectId: string
  initialResources: MaterialResource[]
}

export function MaterialResourceTab({ projectId, initialResources }: MaterialResourceTabProps) {
  const [materials, setMaterials] = useState<MaterialResource[]>(initialResources || [])
  const [newMaterial, setNewMaterial] = useState("")
  const [newType, setNewType] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newCostType, setNewCostType] = useState<"one-time" | "recurring">("one-time")
  const [newCostAmount, setNewCostAmount] = useState("0.00")
  const [newAmortizationPeriod, setNewAmortizationPeriod] = useState("365")
  const [isLoading, setIsLoading] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<MaterialResource | null>(null)

  const handleAddMaterial = async () => {
    if (!newMaterial.trim() || !newType) {
      toast({
        title: "Validation Error",
        description: "Material name and type are required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const newResource = await addMaterialResource(projectId, {
        name: newMaterial,
        type: newType,
        description: newDescription,
        costType: newCostType,
        costAmount: Number.parseFloat(newCostAmount) || 0,
        amortizationPeriod: Number.parseInt(newAmortizationPeriod) || 365,
      })

      setMaterials([...materials, newResource])
      setNewMaterial("")
      setNewType("")
      setNewDescription("")
      setNewCostType("one-time")
      setNewCostAmount("0.00")
      setNewAmortizationPeriod("365")

      toast({
        title: "Success",
        description: "Material resource added successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add material resource",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditMaterial = (material: MaterialResource) => {
    setEditingMaterial(material)
    setNewMaterial(material.name)
    setNewType(material.type)
    setNewDescription(material.description)
    setNewCostType(material.costType)
    setNewCostAmount(material.costAmount.toString())
    setNewAmortizationPeriod(material.amortizationPeriod.toString())
  }

  const handleUpdateMaterial = async () => {
    if (!editingMaterial) return
    if (!newMaterial.trim() || !newType) {
      toast({
        title: "Validation Error",
        description: "Material name and type are required",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const updatedMaterial = await updateMaterialResource(projectId, editingMaterial.id, {
        name: newMaterial,
        type: newType,
        description: newDescription,
        costType: newCostType,
        costAmount: Number.parseFloat(newCostAmount) || 0,
        amortizationPeriod: Number.parseInt(newAmortizationPeriod) || 365,
      })

      setMaterials(materials.map((m) => (m.id === updatedMaterial.id ? updatedMaterial : m)))
      setEditingMaterial(null)
      setNewMaterial("")
      setNewType("")
      setNewDescription("")
      setNewCostType("one-time")
      setNewCostAmount("0.00")
      setNewAmortizationPeriod("365")

      toast({
        title: "Success",
        description: "Material resource updated successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update material resource",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteMaterial = async (id: string) => {
    setIsLoading(true)
    try {
      await deleteMaterialResource(projectId, id)
      setMaterials(materials.filter((material) => material.id !== id))

      toast({
        title: "Success",
        description: "Material resource deleted successfully",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete material resource",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDailyCost = (material: MaterialResource) => {
    if (material.costType === "recurring") {
      return material.costAmount
    } else {
      return material.amortizationPeriod > 0 ? material.costAmount / material.amortizationPeriod : 0
    }
  }

  const totalDailyCost = materials.reduce((total, material) => {
    return total + calculateDailyCost(material)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Add Material Resource Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingMaterial ? "Edit Material Resource" : "Add Material Resource"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="materialName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material Name
            </label>
            <Input
              id="materialName"
              placeholder="e.g., Laptop"
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="materialType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Material Type
            </label>
            <Select value={newType} onValueChange={setNewType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hardware">Hardware</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Office">Office Supplies</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <Textarea
            id="description"
            placeholder="Enter a brief description of the material"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cost Type</label>
          <RadioGroup
            value={newCostType}
            onValueChange={(value) => setNewCostType(value as "one-time" | "recurring")}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="one-time" id="one-time" />
              <Label htmlFor="one-time">One-Time Cost</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="recurring" id="recurring" />
              <Label htmlFor="recurring">Recurring Cost</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="costAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cost Amount ($)
            </label>
            <Input
              id="costAmount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={newCostAmount}
              onChange={(e) => setNewCostAmount(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="amortizationPeriod"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Amortization Period (days)
            </label>
            <Input
              id="amortizationPeriod"
              type="number"
              min="1"
              placeholder="365"
              value={newAmortizationPeriod}
              onChange={(e) => setNewAmortizationPeriod(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          {editingMaterial ? (
            <>
              <Button size="sm" className="flex items-center gap-1" onClick={handleUpdateMaterial} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                Update Material
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingMaterial(null)
                  setNewMaterial("")
                  setNewType("")
                  setNewDescription("")
                  setNewCostType("one-time")
                  setNewCostAmount("0.00")
                  setNewAmortizationPeriod("365")
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" className="flex items-center gap-1" onClick={handleAddMaterial} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Material
            </Button>
          )}
        </div>
      </div>

      {/* Material Resources & Costs Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Material Resources & Costs</h3>

        {materials.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No material resources added yet. Add your first material above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="pb-2 font-medium">Material</th>
                  <th className="pb-2 font-medium">Type</th>
                  <th className="pb-2 font-medium">Description</th>
                  <th className="pb-2 font-medium">Cost Type</th>
                  <th className="pb-2 font-medium">Cost Details</th>
                  <th className="pb-2 font-medium">Daily Cost</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {materials.map((material) => (
                  <tr key={material.id} className="text-sm">
                    <td className="py-3">{material.name}</td>
                    <td className="py-3">{material.type}</td>
                    <td className="py-3">{material.description}</td>
                    <td className="py-3">{material.costType === "one-time" ? "One-time" : "Recurring"}</td>
                    <td className="py-3">
                      ${material.costAmount.toFixed(2)}
                      {material.costType === "one-time" && ` / ${material.amortizationPeriod} days`}
                    </td>
                    <td className="py-3">${calculateDailyCost(material).toFixed(2)}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => handleEditMaterial(material)}
                          disabled={isLoading}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => handleDeleteMaterial(material.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total Cost Summary */}
        {materials.length > 0 && (
          <div className="mt-6 flex justify-end">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md w-64">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Daily Material Cost</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">${totalDailyCost.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
