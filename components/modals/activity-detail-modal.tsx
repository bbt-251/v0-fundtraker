import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ProjectActivity } from "@/types/project"

interface ActivityDetailModalProps {
  isOpen: boolean
  onClose: () => void
  activity: ProjectActivity | null
}

export function ActivityDetailModal({ isOpen, onClose, activity }: ActivityDetailModalProps) {
  if (!activity) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Activity Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Name</h3>
            <p>{activity.name}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p>{activity.description || "No description available"}</p>
          </div>
          {activity.budget && (
            <div className="space-y-2">
              <h3 className="font-medium">Budget</h3>
              <p>${activity.budget.toLocaleString()}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
