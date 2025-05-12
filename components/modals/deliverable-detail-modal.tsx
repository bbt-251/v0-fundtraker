import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProjectDeliverable } from "@/types/project"
import { formatDate } from "@/lib/utils/date-utils"

interface DeliverableDetailModalProps {
  isOpen: boolean
  onClose: () => void
  deliverable: ProjectDeliverable | null
}

export function DeliverableDetailModal({ isOpen, onClose, deliverable }: DeliverableDetailModalProps) {
  if (!deliverable) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Deliverable Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Name</h3>
            <p>{deliverable.name}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p>{deliverable.description || "No description available"}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Deadline</h3>
            <p>{formatDate(deliverable.deadline)}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Status</h3>
            <p>{deliverable.status || "Not set"}</p>
          </div>
          {deliverable.successCriteria && deliverable.successCriteria.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Success Criteria</h3>
              <ul className="list-disc pl-5">
                {deliverable.successCriteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}
          {deliverable.dependentActivities && deliverable.dependentActivities.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Dependent Activities</h3>
              <ul className="list-disc pl-5">
                {deliverable.dependentActivities.map((activityId, index) => (
                  <li key={index}>Activity ID: {activityId}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
