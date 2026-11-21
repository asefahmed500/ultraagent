"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  CalendarDays,
  ChevronUp,
  ChevronsUpDown,
  FileText,
  Inbox,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  Network,
  NotebookPen,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUI } from "@/components/store-provider";
import { CommandBar } from "@/components/command-bar";
import { initials } from "@/lib/format";
import type { Role } from "@/lib/constants";

const NAV = [
  {
    label: "Workspace",
    items: [
      { title: "Home", href: "/dashboard", icon: LayoutDashboard },
      { title: "Orchestration", href: "/dashboard/orchestration", icon: Network },
      { title: "Tasks", href: "/dashboard/tasks", icon: ListChecks },
      { title: "Inbox", href: "/dashboard/inbox", icon: Inbox },
      { title: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
      { title: "Documents", href: "/dashboard/documents", icon: FileText },
      { title: "Reports", href: "/dashboard/reports", icon: Activity },
      { title: "Meetings", href: "/dashboard/meetings", icon: NotebookPen },
      { title: "Approvals", href: "/dashboard/approvals", icon: ShieldCheck, badge: "approvals" },
    ],
  },
  {
    label: "Configure",
    items: [
      { title: "Integrations", href: "/dashboard/integrations", icon: Plug },
      { title: "Triggers", href: "/dashboard/triggers", icon: Zap },
      { title: "Skills", href: "/dashboard/skills", icon: WandSparkles },
      { title: "Activity", href: "/dashboard/activity", icon: Activity },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
      { title: "Admin", href: "/dashboard/admin", icon: ShieldCheck, admin: true },
    ],
  },
];

interface ShellProps {
  children: React.ReactNode;
  user: { name: string; email: string; role: Role; autonomyLevel: string };
  workspace: { name: string; plan: string; region: string };
  pendingApprovals: number;
  unreadNotifications: number;
  savedCommands: Array<{
    id: string;
    label: string;
    instruction: string;
    shortcut: string;
    useCount: number;
  }>;
}

export function DashboardShell({
  children,
  user,
  workspace,
  pendingApprovals,
  unreadNotifications,
  savedCommands,
}: ShellProps) {
  const pathname = usePathname();
  const setCommandBarOpen = useUI((s) => s.setCommandBarOpen);

  return (
    <SidebarProvider>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link href="/dashboard">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="size-4" />
                  </span>
                  <span className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">UltraAgent</span>
                    <span className="text-[11px] text-muted-foreground">{workspace.plan} plan</span>
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {NAV.map((group) => {
            const items = group.items.filter(
              (item) => !("admin" in item && item.admin) || ["admin", "owner"].includes(user.role)
            );
            if (!items.length) return null;
            return (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {items.map((item) => {
                      const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      const count = "badge" in item && item.badge === "approvals" ? pendingApprovals : 0;
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                            <Link href={item.href}>
                              <item.icon />
                              <span>{item.title}</span>
                              {count > 0 ? (
                                <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">
                                  {count}
                                </Badge>
                              ) : null}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">{initials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="flex min-w-0 flex-col gap-0.5 leading-none">
                      <span className="truncate text-sm font-medium">{user.name}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{user.email}</span>
                    </span>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{workspace.name}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild><Link href="/dashboard/settings"><Settings /> Settings</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/dashboard/activity"><Activity /> Activity</Link></DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })} className="text-destructive">
                    <LogOut /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 md:px-6">
          <SidebarTrigger className="-ml-1" />
          <div className="mx-2 h-4 w-px bg-border" />
          <button
            onClick={() => setCommandBarOpen(true)}
            className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted/60"
          >
            <Search className="size-4" />
            <span className="truncate">Tell UltraAgent what to do…</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] sm:inline">⌘K</kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="hidden gap-1.5 md:flex">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {workspace.region}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="size-4" />
                  {unreadNotifications > 0 ? (
                    <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {unreadNotifications > 0 ? (
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/approvals">
                      <MessageSquare /> {unreadNotifications} unread — view approvals
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem disabled>You&apos;re all caught up</DropdownMenuItem>
                )}
                <DropdownMenuItem asChild><Link href="/dashboard/settings"><ChevronUp /> Notification settings</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>

      <CommandBar savedCommands={savedCommands} />
    </SidebarProvider>
  );
}
