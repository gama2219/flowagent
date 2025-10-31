"use client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/hooks/use-auth"
import { MessageSquare, Plus, Settings, LogOut, Workflow, User, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"

export function Sidebar({
  sessions = [],
  activeSessionId,
  onSessionSelect,
  onNewSession,
  collapsed = false,
  onToggleCollapse,
}) {
  const { user, signOut, n8nprofile } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Workflow className="h-6 w-6 text-sidebar-primary" />
              <span className="font-semibold text-sidebar-foreground">AI Workflows</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* New Session Button */}
      <div className="p-4">
        <Button
          onClick={onNewSession}
          className="w-full justify-start gap-2 bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
        >
          <Plus className="h-4 w-4" />
          {!collapsed && "New Workflow Chat"}
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {sessions.map((session) => (
            <Button
              key={session.thread_id}
              variant={activeSessionId === session.thread_id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start gap-2 text-left h-auto py-2 px-3",
                activeSessionId === session.thread_id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              onClick={() => onSessionSelect(session.thread_id)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{session.metadata.thread_name}</div>
                  <div className="truncate text-xs opacity-70">{session.metadata.thread_name || "New Workflow"}</div>
                </div>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-2 py-1">
              <User className="h-4 w-4 text-sidebar-foreground" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium text-sidebar-foreground">{n8nprofile?.firstName}</div>
                <div className="truncate text-xs text-sidebar-foreground/70">{user?.email}</div>
              </div>
            </div>
          )}

          <Separator className="bg-sidebar-border" />

          <div className="flex gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <Settings className="h-4 w-4" />
              {!collapsed && "Settings"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex-1 justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && "Sign Out"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
