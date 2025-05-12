import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProjectTask } from "@/types/project"
import { formatDate } from "@/lib/utils/date-utils"

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: ProjectTask | null
}

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  if (!task) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Name</h3>
            <p>{task.name}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p>{task.description || "No description available"}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Start Date</h3>
              <p>{formatDate(task.startDate)}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">End Date</h3>
              <p>{formatDate(task.endDate)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium">Status</h3>
              <p>{task.status || "Not set"}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Priority</h3>
              <p>{task.priority || "Not set"}</p>
            </div>
          </div>
          {task.assignee && (
            <div className="space-y-2">
              <h3 className="font-medium">Assignee</h3>
              <p>{task.assignee}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
