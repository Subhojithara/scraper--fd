"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Brain,
  Upload,
  Settings,
  BookOpen,
  Mail,
} from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const navigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & analytics",
  },
  {
    title: "Regular Jobs",
    href: "/jobs",
    icon: FileText,
    description: "Standard scraping jobs",
  },
  {
    title: "AI Jobs",
    href: "/jobs-ai",
    icon: Brain,
    description: "AI-powered extraction",
  },
  {
    title: "Emails",
    href: "/emails",
    icon: Mail,
    description: "Email generation & retry",
  },
  {
    title: "Bulk Upload",
    href: "/bulk",
    icon: Upload,
    description: "Batch processing",
  },
  {
    title: "Documentation",
    href: "/docs",
    icon: BookOpen,
    description: "User guide & help",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configuration",
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <SidebarMenu className="space-y-1">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
        
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton 
              asChild 
              isActive={isActive}
              className={cn(
                "group relative transition-all duration-200",
                "hover:bg-sidebar-accent/80 hover:shadow-sm",
                isActive && "bg-sidebar-accent shadow-md shadow-sidebar-primary/10"
              )}
              tooltip={item.description}
            >
              <Link href={item.href} className="relative">
                <Icon className={cn(
                  "size-4 transition-all duration-200",
                  isActive && "text-sidebar-primary-foreground scale-110"
                )} />
                <span className={cn(
                  "transition-all duration-200",
                  isActive && "font-semibold"
                )}>
                  {item.title}
                </span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sidebar-primary rounded-r-full shadow-sm shadow-sidebar-primary/50" />
                )}
                <div className={cn(
                  "absolute inset-0 rounded-md bg-gradient-to-r from-sidebar-primary/0 via-sidebar-primary/10 to-sidebar-primary/0 opacity-0 transition-opacity duration-300",
                  "group-hover:opacity-100"
                )} />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

