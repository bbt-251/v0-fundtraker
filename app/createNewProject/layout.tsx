import type React from "react"
import { AppHeader } from "@/components/app-header"
import { SidebarNav } from "@/components/sidebar-nav"

export default function CreateNewProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col">
            <AppHeader />
            {children}
            {/* <div className="flex-1 items-start md:grid md:grid-cols-[220px_1fr] lg:grid-cols-[240px_1fr]">
                <main className="flex w-full flex-col overflow-hidden"></main>
            </div> */}
        </div>
    )
}
