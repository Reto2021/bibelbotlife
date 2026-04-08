import { Outlet, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

function MeinBereichSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { title: t("meinBereich.overview"), url: "/mein-bereich", icon: Home },
    { title: t("meinBereich.funeral"), url: "/mein-bereich/abdankung", icon: Cross },
    { title: t("meinBereich.wedding"), url: "/mein-bereich/hochzeit", icon: Heart },
    { title: t("meinBereich.baptismCeremony"), url: "/mein-bereich/taufe", icon: Baby },
    { title: t("meinBereich.confirmation"), url: "/mein-bereich/konfirmation", icon: BookHeart },
  ];

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
            {!collapsed && t("meinBereich.sidebarLabel")}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
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
                    {!collapsed && <span>{t("meinBereich.logout")}</span>}
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
