import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Cross, Baby, BookHeart, LogOut, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
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

/** Mobile bottom navigation bar */
function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { label: t("meinBereich.overview"), url: "/mein-bereich", icon: Home, exact: true },
    { label: t("meinBereich.funeral"), url: "/mein-bereich/abdankung", icon: Cross },
    { label: t("meinBereich.wedding"), url: "/mein-bereich/hochzeit", icon: Heart },
    { label: t("meinBereich.baptismCeremony"), url: "/mein-bereich/taufe", icon: Baby },
    { label: t("meinBereich.confirmation"), url: "/mein-bereich/konfirmation", icon: BookHeart },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {items.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.url
            : location.pathname.startsWith(item.url);
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] leading-tight font-medium truncate max-w-[56px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const MeinBereich = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 px-4 py-4 pb-20">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  // Desktop: sidebar layout
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
