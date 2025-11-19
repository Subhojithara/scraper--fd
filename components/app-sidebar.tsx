"use client"

import * as React from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { SidebarNav } from "@/components/sidebar-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sparkles, Zap } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r border-sidebar-border/50">
      <SidebarHeader className="border-b border-sidebar-border/50 bg-gradient-to-b from-sidebar/50 to-sidebar/30 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group">
              <Link href="/dashboard" className="relative overflow-hidden">
                <div className="relative flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary via-sidebar-primary/90 to-sidebar-primary/80 text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20 ring-2 ring-sidebar-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-sidebar-primary/30 group-hover:ring-sidebar-primary/40">
                  <Sparkles className="size-5" />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  </span>
                  <span className="truncate text-xs text-muted-foreground font-medium">
                    AI-Powered Scraping
                  </span>
                </div>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-sidebar-primary/0 via-sidebar-primary/5 to-sidebar-primary/0 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNav />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-sidebar-foreground/70" />
                <span className="text-xs font-medium text-sidebar-foreground/80">Theme</span>
              </div>
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}


