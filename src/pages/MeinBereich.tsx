import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Heart, Cross, Baby, BookHeart, LogOut, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Übersicht", url: "/mein-bereich", icon: Home },
  { title: "Abdankung", url: "/mein-bereich/abdankung", icon: Cross },
  { title: "Hochzeit", url: "/mein-bereich/hochzeit", icon: Heart },
  { title: "Taufe", url: "/mein-bereich/taufe", icon: Baby },
  { title: "Konfirmation", url: "/mein-bereich/konfirmation", icon: BookHeart },
];

function MeinBereichSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="justify-between">
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {!collapsed && "Mein Bereich"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/mein-bereich"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button onClick={handleSignOut} className="hover:bg-muted/50 w-full flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Abmelden</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

const MeinBereich = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <MeinBereichSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-2">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default MeinBereich;
