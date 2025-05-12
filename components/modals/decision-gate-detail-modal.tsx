import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { DecisionGate } from "@/types/project"
import { formatDate } from "@/lib/utils/date-utils"

interface DecisionGateDetailModalProps {
  isOpen: boolean
  onClose: () => void
  decisionGate: DecisionGate | null
}

export function DecisionGateDetailModal({ isOpen, onClose, decisionGate }: DecisionGateDetailModalProps) {
  if (!decisionGate) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Decision Gate Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">Name</h3>
            <p>{decisionGate.name}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Description</h3>
            <p>{decisionGate.description || "No description available"}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Date</h3>
            <p>{formatDate(decisionGate.dateTime)}</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Status</h3>
            <p>{decisionGate.status || "Not set"}</p>
          </div>
          {decisionGate.criteria && (
            <div className="space-y-2">
              <h3 className="font-medium">Criteria</h3>
              <ul className="list-disc pl-5">
                {decisionGate.criteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
