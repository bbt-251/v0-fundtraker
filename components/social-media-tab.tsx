"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { addSocialMediaAccount, deleteSocialMediaAccount, getProject } from "@/services/project-service"
import type { SocialMediaAccount } from "@/types/project"

interface SocialMediaTabProps {
  projectId: string
  initialAccounts?: SocialMediaAccount[]
}

export function SocialMediaTab({ projectId, initialAccounts = [] }: SocialMediaTabProps) {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>(initialAccounts)
  const [platform, setPlatform] = useState("")
  const [username, setUsername] = useState("")
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const project = await getProject(projectId)
        if (project && project.socialMediaAccounts) {
          setAccounts(project.socialMediaAccounts)
        }
      } catch (error) {
        console.error("Error fetching project:", error)
      }
    }

    if (initialAccounts.length === 0) {
      fetchProject()
    }
  }, [projectId, initialAccounts])

  const handleAddAccount = async () => {
    if (!platform || !username) {
      toast({
        title: "Missing information",
        description: "Please provide both platform and username",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const newAccount = await addSocialMediaAccount(projectId, {
        platform,
        username,
        url: url || undefined,
      })

      setAccounts([...accounts, newAccount])

      // Reset form
      setPlatform("")
      setUsername("")
      setUrl("")

      toast({
        title: "Account added",
        description: `${platform} account has been added successfully`,
      })
    } catch (error) {
      console.error("Error adding social media account:", error)
      toast({
        title: "Error",
        description: "Failed to add social media account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAccount = async (id: string) => {
    try {
      await deleteSocialMediaAccount(projectId, id)
      setAccounts(accounts.filter((account) => account.id !== id))

      toast({
        title: "Account removed",
        description: "Social media account has been removed",
      })
    } catch (error) {
      console.error("Error removing social media account:", error)
      toast({
        title: "Error",
        description: "Failed to remove social media account",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Social Media Accounts</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            placeholder="e.g. Twitter, LinkedIn"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full"
            aria-label="Platform"
          />
        </div>
        <div>
          <Input
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full"
            aria-label="Username"
          />
        </div>
        <div>
          <Input
            placeholder="Profile URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full"
            aria-label="URL (optional)"
          />
        </div>
      </div>

      <Button onClick={handleAddAccount} className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Social Media Account"}
      </Button>

      {accounts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-md font-medium mb-2">Added Accounts</h3>
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-md bg-gray-800 dark:bg-gray-800 border border-gray-700"
              >
                <div>
                  <span className="font-medium">{account.platform}</span>
                  <span className="mx-2">-</span>
                  <span>{account.username}</span>
                  {account.url && (
                    <>
                      <span className="mx-2">-</span>
                      <a
                        href={account.url.startsWith("http") ? account.url : `https://${account.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        {account.url}
                      </a>
                    </>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAccount(account.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
