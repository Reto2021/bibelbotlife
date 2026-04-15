import { Outlet } from "react-router-dom";
import { Calendar, Plus, BookOpen, Users, Settings, Home, ListMusic, FileText, Receipt, LayoutTemplate } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Link } from "react-router-dom";
import { BibleBotChat } from "@/components/BibelBotChat";

const navItems = [
  { title: "Übersicht", url: "/dashboard", icon: Home },
  { title: "Kalender", url: "/dashboard/services", icon: Calendar },
  { title: "Bibliothek", url: "/dashboard/resources", icon: BookOpen },
  { title: "Serien", url: "/dashboard/series", icon: ListMusic },
  { title: "Vorlagen", url: "/dashboard/templates", icon: LayoutTemplate },
  { title: "Register", url: "/dashboard/records", icon: FileText },
  { title: "Team", url: "/dashboard/team", icon: Users },
  { title: "Rechnungen", url: "/dashboard/invoices", icon: Receipt },
  { title: "Einstellungen", url: "/dashboard/settings", icon: Settings },
];

function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 flex items-center gap-2">
          <Link to="/">
            <AppLogo className="h-8 w-8" />
          </Link>
          {!collapsed && (
            <Link to="/" className="font-bold text-foreground">
              BibleBot<span className="text-sm font-normal text-muted-foreground">.Life</span>
            </Link>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Messeplaner</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/dashboard"} className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User section at bottom */}
        <div className="mt-auto p-4 border-t border-border">
          {!collapsed && (
            <p className="text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
          )}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => signOut()}>
            <LogOut className="h-4 w-4 mr-2" />
            {!collapsed && "Abmelden"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
            <SidebarTrigger className="mr-4" />
            <span className="text-sm font-medium text-muted-foreground">Messeplaner</span>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <BibleBotChat />
    </SidebarProvider>
  );
}
