import { AlertCircle } from "lucide-react"

interface CorsErrorBannerProps {
  error: string
}

export function CorsErrorBanner({ error }: CorsErrorBannerProps) {
  const isCorsError = error.toLowerCase().includes("cors")

  if (!isCorsError) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-500 p-4 rounded-md mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-amber-500" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">CORS Configuration Required</h3>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            <p>
              There was an issue uploading files due to CORS (Cross-Origin Resource Sharing) restrictions. To fix this:
            </p>
            <ol className="list-decimal ml-5 mt-2 space-y-1">
              <li>Go to your Firebase Console</li>
              <li>Navigate to Storage &gt; Rules</li>
              <li>
                Add proper CORS configuration using the Firebase CLI:
                <pre className="mt-2 bg-amber-100 dark:bg-amber-900/50 p-2 rounded text-xs overflow-x-auto">
                  {`firebase init storage\nfirebase storage:cors`}
                </pre>
              </li>
              <li>
                Create a cors.json file with:
                <pre className="mt-2 bg-amber-100 dark:bg-amber-900/50 p-2 rounded text-xs overflow-x-auto">
                  {`[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-*"]
  }
]`}
                </pre>
              </li>
              <li>
                Apply the configuration:
                <pre className="mt-2 bg-amber-100 dark:bg-amber-900/50 p-2 rounded text-xs overflow-x-auto">
                  {`gsutil cors set cors.json gs://YOUR-BUCKET-NAME.appspot.com`}
                </pre>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
