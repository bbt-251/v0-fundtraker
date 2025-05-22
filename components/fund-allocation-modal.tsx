"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth-context";
import { getProjectDonations } from "@/services/donation-service";
import { getProjectById } from "@/services/project-service";
import { Project } from "@/types/project";
import dayjs from "dayjs";
import { Timestamp } from "firebase/firestore";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

interface FundAllocationModalProps {
    projectId: string;
    donationId: string;
}

interface Resource {
    id: string;
    resourceId: string;
    resourceType: "human" | "material";
    quantity: number;
    dailyCost: number;
    totalCost: number;
    remainingBudget: number; // Tracks the remaining unfulfilled budget for this resource
    name?: string;
    contributionPercentage?: number
}

interface Task {
    id: string;
    name: string;
    status: string;
    resources: Resource[];
    startDate: string;
    endDate: string;
    completionPercentage?: number;
    allocationAmount?: number; // Tracks the total allocation for this task
}

interface Donation {
    id: string;
    amount: number;
    timestamp: Timestamp;
    projectId?: string;
}

type AllocationData = {
    id: string;
    taskId: string;
    taskName: string;
    startDate: string;
    endDate: string;
    contributedAmount: number;
    totalCost: number;
    completionPercentage: number; // this line is new
};

export function FundAllocationModal({ donationId, projectId }: FundAllocationModalProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [allocationData, setAllocationData] = useState<AllocationData[]>([])

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const { user } = useAuth();

    useEffect(() => {
        const fetchProjectAndDonationData = async () => {
            const project: Project | null = await getProjectById(projectId);
            const donationsForProject: Donation[] = await getProjectDonations(projectId);
            const currentDonation: Donation | undefined = donationsForProject.find(d => d.id === donationId);

            if (!project || !currentDonation) return;

            const allDonations = donationsForProject.sort((a, b) =>
                dayjs(a.timestamp.toDate()).valueOf() - dayjs(b.timestamp.toDate()).valueOf()
            );

            console.log(
                "allDonations: ",
                allDonations.map((d) => ({
                    ...d,
                    timestamp: dayjs(d.timestamp.toDate()).format("MMMM DD, YYYY hh:mm A"),
                    amount: d.amount,
                    ogTimestamp: d.timestamp,
                }))
            );

            const tasks = [...project.tasks].sort(
                (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            );

            const taskCostMap: Record<string, number> = {}; // taskId -> remaining cost
            const taskInfoMap: Record<string, { id: string; name: string; startDate: string; endDate: string; cost: number }> = {};

            for (const task of tasks) {
                const totalCost = task.resources.reduce((sum, res) => sum + (res.totalCost ?? res.dailyCost * res.quantity * res.duration), 0);

                taskCostMap[task.id] = totalCost;
                taskInfoMap[task.id] = {
                    id: task.id,
                    name: task.name,
                    startDate: task.startDate,
                    endDate: task.endDate,
                    cost: totalCost,
                };
            }

            const allocationMap: Record<string, Record<string, number>> = {}; // { donationId: { taskId: amount } }

            // FIFO donation allocation at task level
            for (const donation of allDonations) {
                let remaining = donation.amount;

                for (const task of tasks) {
                    const taskId = task.id;
                    const needed = taskCostMap[taskId];

                    if (needed > 0 && remaining > 0) {
                        const alloc = Math.min(needed, remaining);
                        taskCostMap[taskId] -= alloc;
                        remaining -= alloc;

                        if (!allocationMap[donation.id]) allocationMap[donation.id] = {};
                        allocationMap[donation.id][taskId] = (allocationMap[donation.id][taskId] || 0) + alloc;

                        if (remaining <= 0) break;
                    }
                }
            }

            // Prepare AllocationData[] for the selected donation
            const donationAllocations = allocationMap[donationId] || {};
            const data: AllocationData[] = Object.entries(donationAllocations).map(([taskId, contributedAmount]) => {
                const task = taskInfoMap[taskId];
                return {
                    id: task.id,
                    taskId: task.id,
                    taskName: task.name,
                    startDate: dayjs(task.startDate).format('MMMM DD, YYYY'),
                    endDate: dayjs(task.endDate).format('MMMM DD, YYYY'),
                    contributedAmount,
                    completionPercentage: Math.round((contributedAmount / task.cost) * 100),
                    totalCost: task.cost,
                };
            });

            setAllocationData(data);
            setLoading(false);
        };

        if (open) fetchProjectAndDonationData();
    }, [open, projectId, donationId]);

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="View fund allocation">
                <MoreHorizontal className="h-4 w-4" />
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[800px] w-[90vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Fund Allocation Details</DialogTitle>
                        <DialogDescription>
                            See how donations are allocated to tasks in this project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8 py-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        ) : allocationData.length === 0 ? (
                            <div className="text-center p-4 border rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400">No allocation data available yet.</p>
                            </div>
                        ) : (
                            <>
                                {allocationData.map((task) => (
                                    <div key={task.id} className="space-y-2 bg-gray-900 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-md font-medium text-white">
                                                Task {task.taskName} : {task.completionPercentage}%
                                            </h3>
                                            <span className="text-sm text-gray-300">
                                                {formatCurrency(task.contributedAmount)}
                                            </span>
                                        </div>

                                        <Progress value={task.completionPercentage} className="h-2 mb-4" />

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="text-left text-xs uppercase text-gray-400">
                                                        {/* <th className="py-2 px-2">Task ID</th> */}
                                                        <th className="py-2 px-2">Task Name</th>
                                                        <th className="py-2 px-2">Start Date</th>
                                                        <th className="py-2 px-2">End Date</th>
                                                        <th className="py-2 px-2">Contribution</th>
                                                        <th className="py-2 px-2">Total Cost</th>
                                                        <th className="py-2 px-2">Completion %</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr className="border-t border-gray-700">
                                                        {/* <td className="py-2 px-2 text-white">{task.taskId}</td> */}
                                                        <td className="py-2 px-2 text-white">{task.taskName}</td>
                                                        <td className="py-2 px-2 text-white">{task.startDate}</td>
                                                        <td className="py-2 px-2 text-white">{task.endDate}</td>
                                                        <td className="py-2 px-2 text-white">{formatCurrency(task.contributedAmount)}</td>
                                                        <td className="py-2 px-2 text-white">{formatCurrency(task.totalCost)}</td>
                                                        <td className="py-2 px-2 text-white">{task.completionPercentage}%</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
