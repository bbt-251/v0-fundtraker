"use client"

import { useState } from "react"
import { Pencil, Trash2, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { addHumanResource, deleteHumanResource, updateHumanResource } from "@/services/project-service"
import type { HumanResource } from "@/types/project"
import { useToast } from "@/hooks/use-toast"

interface HumanResourceTabProps {
    projectId: string
    initialResources: HumanResource[]
}

export function HumanResourceTab({ projectId, initialResources }: HumanResourceTabProps) {
    const [resources, setResources] = useState<HumanResource[]>(initialResources || [])
    const [newRole, setNewRole] = useState("")
    const [newCost, setNewCost] = useState("0.00")
    const [newQuantity, setNewQuantity] = useState("1")
    const [isLoading, setIsLoading] = useState(false)
    const [editingResource, setEditingResource] = useState<HumanResource | null>(null)
    const { toast } = useToast()

    const handleAddRole = async () => {
        if (!newRole.trim()) {
            toast({
                title: "Validation Error",
                description: "Role title is required",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const newResource = await addHumanResource(projectId, {
                role: newRole,
                costPerDay: Number.parseFloat(newCost) || 0,
                quantity: Number.parseInt(newQuantity) || 1,
            })

            setResources([...resources, newResource])
            setNewRole("")
            setNewCost("0.00")
            setNewQuantity("1")

            toast({
                title: "Success",
                description: "Human resource added successfully",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add human resource",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditRole = (resource: HumanResource) => {
        setEditingResource(resource)
        setNewRole(resource.role)
        setNewCost(resource.costPerDay.toString())
        setNewQuantity(resource.quantity.toString())
    }

    const handleUpdateRole = async () => {
        if (!editingResource) return
        if (!newRole.trim()) {
            toast({
                title: "Validation Error",
                description: "Role title is required",
                variant: "destructive",
            })
            return
        }

        setIsLoading(true)
        try {
            const updatedResource = await updateHumanResource(projectId, editingResource.id, {
                role: newRole,
                costPerDay: Number.parseFloat(newCost) || 0,
                quantity: Number.parseInt(newQuantity) || 1,
            })

            setResources(resources.map((r) => (r.id === updatedResource.id ? updatedResource : r)))
            setEditingResource(null)
            setNewRole("")
            setNewCost("0.00")
            setNewQuantity("1")

            toast({
                title: "Success",
                description: "Human resource updated successfully",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update human resource",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteRole = async (id: string) => {
        setIsLoading(true)
        try {
            await deleteHumanResource(projectId, id)
            setResources(resources.filter((resource) => resource.id !== id))

            toast({
                title: "Success",
                description: "Human resource deleted successfully",
            })
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete human resource",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const totalDailyCost = resources.reduce((total, resource) => {
        return total + resource.costPerDay * resource.quantity
    }, 0)

    return (
        <div className="space-y-6">
            {/* Add Project Role Form */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{editingResource ? "Edit Project Role" : "Add Project Role"}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="roleTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role Title
                        </label>
                        <Input
                            id="roleTitle"
                            placeholder="e.g., Project Manager"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="costPerDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cost Per Day ($)
                        </label>
                        <Input
                            id="costPerDay"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={newCost}
                            onChange={(e) => setNewCost(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity
                        </label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            placeholder="1"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    {editingResource ? (
                        <>
                            <Button size="sm" className="flex items-center gap-1" onClick={handleUpdateRole} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                                Update Role
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    setEditingResource(null)
                                    setNewRole("")
                                    setNewCost("0.00")
                                    setNewQuantity("1")
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                        </>
                    ) : (
                        <Button size="sm" className="flex items-center gap-1" onClick={handleAddRole} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Add Role
                        </Button>
                    )}
                </div>
            </div>

            {/* Project Roles & Costs Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Project Roles & Costs</h3>

                {resources.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No human resources added yet. Add your first role above.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="pb-2 font-medium">Role</th>
                                    <th className="pb-2 font-medium">Cost Per Day</th>
                                    <th className="pb-2 font-medium">Quantity</th>
                                    <th className="pb-2 font-medium">Total Daily Cost</th>
                                    <th className="pb-2 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {resources.map((resource) => (
                                    <tr key={resource.id} className="text-sm">
                                        <td className="py-3">{resource.role}</td>
                                        <td className="py-3">${resource.costPerDay.toFixed(2)}</td>
                                        <td className="py-3">{resource.quantity}</td>
                                        <td className="py-3">${(resource.costPerDay * resource.quantity).toFixed(2)}</td>
                                        <td className="py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    onClick={() => handleEditRole(resource)}
                                                    disabled={isLoading}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    onClick={() => handleDeleteRole(resource.id)}
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
                {resources.length > 0 && (
                    <div className="mt-6 flex justify-end">
                        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md w-64">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Total Daily Human Resource Cost
                            </div>
                            <div className="text-xl font-bold text-gray-900 dark:text-white">${totalDailyCost.toFixed(2)}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
