import { Check } from "lucide-react"

interface ProjectDefinitionStepperProps {
  currentStep: "project-info" | "documentation"
  onStepClick?: (step: "project-info" | "documentation") => void
}

export function ProjectDefinitionStepper({ currentStep, onStepClick }: ProjectDefinitionStepperProps) {
  return (
    <div className="px-8 py-6 bg-gray-50 dark:bg-gray-800/50 my-5">
      <div className="flex items-center">
        <div className="flex items-center relative">
          <div
            className={`rounded-full transition duration-500 ease-in-out h-12 w-12 flex items-center justify-center ${
              currentStep === "project-info" ? "bg-blue-600" : "bg-blue-600"
            }`}
          >
            {currentStep === "documentation" ? (
              <Check className="h-6 w-6 text-white" />
            ) : (
              <span className="text-white text-sm font-medium">1</span>
            )}
          </div>
          <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-gray-600 dark:text-gray-400">
            Project Information
          </div>
        </div>
        <div
          className={`flex-auto border-t-2 transition duration-500 ease-in-out ${
            currentStep === "documentation" ? "border-blue-600" : "border-gray-300 dark:border-gray-700"
          }`}
        ></div>
        <div className="flex items-center relative">
          <div
            className={`rounded-full transition duration-500 ease-in-out h-12 w-12 flex items-center justify-center ${
              currentStep === "documentation" ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span className="text-white text-sm font-medium">2</span>
          </div>
          <div className="absolute top-0 -ml-10 text-center mt-16 w-32 text-xs font-medium text-gray-600 dark:text-gray-400">
            Business Documentation
          </div>
        </div>
      </div>
    </div>
  )
}
