import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { ToastProvider } from "@/components/ui/toast"
import { ProjectNotification } from "@/components/project-notification"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FundTracker - Make Every Penny Transparent and Accountable",
  description:
    "FundTracker helps you manage funds with complete transparency, showing exactly where each penny is allocated through milestone-based disbursement workflows.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ProjectNotification />
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
