import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu, X as XIcon, HandHeart, GraduationCap, Building2, HeartHandshake,
  Send, FileText, ShieldCheck, LogIn, LogOut, User, Shield, MessageCircle, Heart,
  ChevronDown, BookOpen, Mail
} from "lucide-react";
import { AppLogo } from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";
import { resetBibleBotChat } from "@/lib/chat-events";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TELEGRAM_LINK = "https://t.me/meinbibelbot";

export function SiteHeader() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (location.pathname === "/" || location.pathname === "/index") {
      e.preventDefault();
      resetBibleBotChat();
    }
  };

  const scrollToChat = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" }), 300);
    } else {
      document.getElementById("chat")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2.5 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
        >
          <AppLogo className="h-9 w-9 lg:h-11 lg:w-11" />
          <div className="flex w-max flex-col">
            <span className="text-base lg:text-lg font-bold text-foreground leading-tight">
              BibleBot<span className="text-sm font-normal text-muted-foreground dark:text-amber-400">.Life</span>
            </span>
            <span className="hidden pl-[1px] text-[8px] font-medium tracking-[0.18em] uppercase text-muted-foreground/70 dark:text-amber-400/70 lg:block">
              Everyday Sunday
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {/* Primary links */}
          <Button asChild variant="ghost" size="sm">
            <Link to="/gebetswand">
              <HandHeart className="h-4 w-4 mr-1.5" />
              {t("nav.prayerWall")}
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/bibelquiz">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              {t("nav.bibleQuiz")}
            </Link>
          </Button>

          {/* More dropdown for secondary links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                {t("nav.more", "Mehr")}
                <ChevronDown className="h-3.5 w-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link to="/for-churches" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="h-4 w-4" />
                  {t("institutions.badge")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/fuer-seelsorger" className="flex items-center gap-2 cursor-pointer">
                  <HeartHandshake className="h-4 w-4" />
                  {t("nav.forCelebrants")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/churches" className="flex items-center gap-2 cursor-pointer">
                  <BookOpen className="h-4 w-4" />
                  {t("church.directoryBadge")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/spenden" className="flex items-center gap-2 cursor-pointer">
                  <Heart className="h-4 w-4" />
                  {t("nav.donate", "Spenden")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/kontakt" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  {t("nav.contact", "Kontakt")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/ueber-uns" className="flex items-center gap-2 cursor-pointer">
                  <Users className="h-4 w-4" />
                  {t("nav.about", "Über uns")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 cursor-pointer">
                  <Send className="h-4 w-4" />
                  Telegram Bot
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-5 bg-border mx-1" />

          {/* Utilities */}
          <LanguageSwitcher />
          <DarkModeToggle />

          {/* Auth */}
          {user ? (
            <>
              {isAdmin && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <Shield className="h-4 w-4 mr-1" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/mein-bereich">
                  <User className="h-4 w-4 mr-1" />
                  {t("meinBereichNav")}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-1" />
                {t("auth.loginShort")}
              </Link>
            </Button>
          )}

          {/* Primary CTA */}
          <Button size="sm" onClick={scrollToChat} className="ml-1">
            <MessageCircle className="h-4 w-4 mr-1.5" />
            {t("nav.openChat")}
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-1 lg:hidden">
          <LanguageSwitcher />
          <DarkModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden border-t border-border bg-card/95 backdrop-blur-sm overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 border-t-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-3 flex flex-col gap-0.5">
          {/* Primary CTA at top */}
          <Button
            className="w-full mb-2"
            onClick={() => { setMobileMenuOpen(false); scrollToChat(); }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {t("nav.openChat")}
          </Button>

          {/* Main links */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-2 pb-1">
            {t("nav.explore", "Entdecken")}
          </p>
          <Link to="/gebetswand" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <HandHeart className="h-4 w-4 text-primary" />
            {t("nav.prayerWall")}
          </Link>
          <Link to="/bibelquiz" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <GraduationCap className="h-4 w-4 text-primary" />
            {t("nav.bibleQuiz")}
          </Link>
          <Link to="/churches" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <BookOpen className="h-4 w-4 text-primary" />
            {t("church.directoryBadge")}
          </Link>

          {/* For professionals */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
            {t("nav.professionals", "Für Fachpersonen")}
          </p>
          <Link to="/for-churches" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <Building2 className="h-4 w-4 text-primary" />
            {t("institutions.badge")}
          </Link>
          <Link to="/fuer-seelsorger" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <HeartHandshake className="h-4 w-4 text-primary" />
            {t("nav.forCelebrantsMobile")}
          </Link>

          {/* Support & legal */}
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 pt-3 pb-1">
            {t("nav.support", "Unterstützen")}
          </p>
          <Link to="/spenden" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <Heart className="h-4 w-4 text-primary" />
            {t("nav.donate", "Spenden")}
          </Link>
          <a href={TELEGRAM_LINK} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <Send className="h-4 w-4 text-primary" />
            Telegram Bot
          </a>
          <Link to="/kontakt" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <Mail className="h-4 w-4 text-primary" />
            {t("nav.contact", "Kontakt")}
          </Link>

          {/* Auth */}
          <div className="border-t border-border mt-2 pt-2">
            {user ? (
              <>
                <Link to="/mein-bereich" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  <User className="h-4 w-4 text-primary" />
                  {t("meinBereichNav")}
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    <Shield className="h-4 w-4 text-primary" />
                    Admin
                  </Link>
                )}
                <button onClick={() => { signOut(); setMobileMenuOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors w-full">
                  <LogOut className="h-4 w-4 text-primary" />
                  {t("auth.logout")}
                </button>
              </>
            ) : (
              <Link to="/login" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-foreground hover:bg-primary/10 transition-colors" onClick={() => setMobileMenuOpen(false)}>
                <LogIn className="h-4 w-4 text-primary" />
                {t("auth.loginShort")}
              </Link>
            )}
          </div>

          {/* Legal footer */}
          <div className="flex items-center gap-4 px-3 pt-2 pb-1 text-xs text-muted-foreground">
            <Link to="/impressum" className="hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {t("footer.impressum")}
            </Link>
            <Link to="/datenschutz" className="hover:text-foreground transition-colors" onClick={() => setMobileMenuOpen(false)}>
              {t("footer.datenschutz")}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
