"use client"

import { useState, useEffect } from "react"
import type { ProjectRisk } from "@/types/project"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, AlertCircle, Info } from "lucide-react"

interface RiskMatrixTabProps {
  projectId: string
  risks: ProjectRisk[]
}

interface RiskCell {
  impact: number
  probability: number
  risks: ProjectRisk[]
}

export function RiskMatrixTab({ projectId, risks }: RiskMatrixTabProps) {
  const [riskMatrix, setRiskMatrix] = useState<RiskCell[][]>([])
  const [selectedCell, setSelectedCell] = useState<RiskCell | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Initialize the risk matrix
    const matrix: RiskCell[][] = []

    // Create a 5x5 matrix (probability x impact)
    for (let p = 5; p >= 1; p--) {
      const row: RiskCell[] = []
      for (let i = 1; i <= 5; i++) {
        const cellRisks = risks.filter((risk) => risk.probability === p && risk.impact === i)
        row.push({
          impact: i,
          probability: p,
          risks: cellRisks,
        })
      }
      matrix.push(row)
    }

    setRiskMatrix(matrix)
  }, [risks])

  const handleCellClick = (cell: RiskCell) => {
    if (cell.risks.length > 0) {
      setSelectedCell(cell)
      setIsModalOpen(true)
    }
  }

  const getRiskLevelColor = (impact: number, probability: number) => {
    const riskScore = impact * probability

    if (riskScore >= 16) {
      return "bg-red-900/30 hover:bg-red-800/40 border-red-700/50 text-red-400"
    } else if (riskScore >= 9) {
      return "bg-amber-900/30 hover:bg-amber-800/40 border-amber-700/50 text-amber-400"
    } else {
      return "bg-green-900/30 hover:bg-green-800/40 border-green-700/50 text-green-400"
    }
  }

  const getRiskLevelIcon = (impact: number, probability: number) => {
    const riskScore = impact * probability

    if (riskScore >= 16) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    } else if (riskScore >= 9) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    } else {
      return <Info className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="p-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Risk Matrix</h3>
        <p className="text-sm text-gray-400 mb-4">
          Click on a cell to view details of risks with that impact and probability combination.
        </p>
      </div>

      <div className="flex">
        {/* Probability label - vertical */}
        <div className="flex flex-col justify-center mr-2">
          <div className="transform -rotate-90 origin-center whitespace-nowrap text-center font-medium text-sm">
            PROBABILITY
          </div>
        </div>

        {/* Matrix table */}
        <div className="overflow-x-auto max-w-3xl">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-700 p-2 w-16"></th>
                <th colSpan={5} className="border border-gray-700 p-2 text-center font-medium">
                  IMPACT
                </th>
              </tr>
              <tr>
                <th className="border border-gray-700 p-2 w-16"></th>
                {[1, 2, 3, 4, 5].map((impact) => (
                  <th key={impact} className="border border-gray-700 p-2 w-16 text-center">
                    {impact}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskMatrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <th className="border border-gray-700 p-2 text-center w-16">{5 - rowIndex}</th>
                  {row.map((cell, cellIndex) => {
                    const hasRisks = cell.risks.length > 0
                    const riskScore = cell.impact * cell.probability
                    let cellClass = "border border-gray-700 p-2 text-center w-16 h-16"

                    if (hasRisks) {
                      cellClass += ` ${getRiskLevelColor(cell.impact, cell.probability)}`
                    } else {
                      cellClass += " hover:bg-gray-800"
                    }

                    return (
                      <td key={cellIndex} className={cellClass} onClick={() => handleCellClick(cell)}>
                        {hasRisks ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-medium">{cell.risks.length}</span>
                            <span className="text-xs">risk{cell.risks.length > 1 ? "s" : ""}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium mb-2">Legend:</h4>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-900/30 border border-green-700/50"></div>
            <span className="text-sm">Low Risk (1-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-900/30 border border-amber-700/50"></div>
            <span className="text-sm">Medium Risk (9-15)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-900/30 border border-red-700/50"></div>
            <span className="text-sm">High Risk (16-25)</span>
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl bg-gray-900 border border-gray-700">
          <DialogHeader>
            <DialogTitle>
              Risks with Impact {selectedCell?.impact} and Probability {selectedCell?.probability}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              {selectedCell?.risks.map((risk) => (
                <div key={risk.id} className="border border-gray-700 rounded-md p-4 bg-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-lg">{risk.name}</h3>
                    <Badge variant={risk.status === "Active" ? "destructive" : "outline"}>{risk.status}</Badge>
                  </div>
                  <p className="text-gray-300 mb-3">{risk.description}</p>
                  <div className="flex gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      {getRiskLevelIcon(risk.impact, risk.probability)}
                      <span className="text-sm">
                        Risk Score: <span className="font-medium">{risk.riskScore}</span>
                      </span>
                    </div>
                    <div className="text-sm">
                      Impact: <span className="font-medium">{risk.impact}</span>
                    </div>
                    <div className="text-sm">
                      Probability: <span className="font-medium">{risk.probability}</span>
                    </div>
                  </div>
                  {risk.mitigationActions && risk.mitigationActions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Mitigation Actions:</h4>
                      <ul className="list-disc pl-5 text-sm space-y-1">
                        {risk.mitigationActions.map((action) => (
                          <li key={action.id}>{action.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
